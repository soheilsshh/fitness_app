package main

import (
	"archive/zip"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// USDA FoodData Central SR Legacy — public bulk download, no API key and no
// per-request rate limit (unlike the REST search API), which is what makes
// matching thousands of catalog entries in one run feasible.
const usdaDatasetURL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip"

// Extended nutrient fields we enrich, keyed by USDA's stable "nutrient_nbr"
// (the same numbering scheme exposed by the REST API's nutrientNumber).
var targetNutrientFields = map[string]string{
	"301": "calcium",
	"303": "iron",
	"304": "magnesium",
	"305": "phosphorus",
	"306": "potassium",
	"307": "sodium",
	"601": "cholesterol",
	"606": "saturatedFat",
	"605": "transFat",
}

type usdaFood struct {
	fdcID        string
	description  string
	primaryToken string // stemmed first word of description, e.g. "grape"
	tokens       map[string]bool
	nutrients    map[string]float64 // Food-struct field name -> per-100g value
}

type usdaIndex struct {
	foods []usdaFood
}

type matchResult struct {
	fdcID string
	score float64
	food  *usdaFood
}

// categoryDenylist rejects candidates from product categories our plain
// dictionary phrases never intend to match — mainly baby food, which is
// disproportionately likely to win on raw token overlap (short, generic
// descriptions like "Babyfood, juice, apple and grape") while being a poor
// stand-in for the staple ingredient the query actually means.
var categoryDenylist = []string{"babyfood", "baby food", "infant formula"}

// stemSet stems each raw word and returns them as a lookup set — word lists
// below are easier to read/extend as plain words, but candidate tokens are
// always stemmed (see tokenize), so the lookup keys must be too, e.g.
// "varieties" only matches as its stemmed form "varieti".
func stemSet(words ...string) map[string]bool {
	out := make(map[string]bool, len(words))
	for _, w := range words {
		out[stem(w)] = true
	}
	return out
}

// formChangingWords fundamentally change what a food *is*, not just add
// detail — "orange" and "orange juice" are different foods nutritionally
// (juice loses the fiber, concentrates the sugar), but a naive overlap
// score can still rank the juice above "Oranges, raw, all commercial
// varieties" simply because its description happens to have fewer extra
// words. A candidate introducing one of these that the query didn't ask
// for is rejected outright rather than scored down.
var formChangingWords = stemSet(
	"juice", "powder", "dried", "concentrate",
	"extract", "syrup", "sauce", "paste",
	"flour", "oil", "butter", "jam", "jelly",
	"canned", "frozen", "dehydrated", "candied",
	"chips", "crackers", "cereal",
	// Plant/animal *parts* — "peel"/"skin" etc. read as full-token matches
	// on a bare "orange raw" query but are a different food from the fruit.
	"peel", "skin", "seed", "pit", "rind",
	"core", "stem", "leaves", "leaf", "root",
	"husk", "shell", "bran", "germ",
)

// genericFillerWords broaden a description ("all commercial varieties")
// rather than narrow it to a specific subtype — they don't count as "extra"
// when scoring, so the generic entry isn't penalized relative to one naming
// a specific region/cultivar (see bestMatch).
var genericFillerWords = stemSet(
	"all", "commercial", "varieties", "variety",
	"type", "types", "or", "and", "the",
	"of", "including", "includes",
)

func introducesUnwantedForm(queryTokens, candidateTokens map[string]bool) bool {
	for t := range candidateTokens {
		if formChangingWords[t] && !queryTokens[t] {
			return true
		}
	}
	return false
}

func firstWord(s string) string {
	tokens := strings.Fields(strings.ToLower(stripNoise(s)))
	if len(tokens) == 0 {
		return ""
	}
	loc := tokenSplitter.Split(tokens[0], -1)
	for _, p := range loc {
		if p != "" {
			return stem(p)
		}
	}
	return ""
}

// bestMatch requires every query token to appear in the candidate (perfect
// recall on the query) AND the candidate's leading word to match the
// query's leading word — SR Legacy consistently names foods
// "MainIngredient, qualifier, qualifier, ..." and our dictionary phrases
// follow the same "main word first" convention, so this is a strong,
// cheap precision filter (it's what catches the SR Legacy babyfood entry
// that would otherwise out-score a proper match on raw overlap alone).
// Remaining candidates are scored by how much of the candidate is "extra"
// beyond the query (Jaccard-style), so a near-exact description outranks
// one buried in unrelated qualifiers. Returns nil below minScore.
func (idx *usdaIndex) bestMatch(query string, minScore float64) *matchResult {
	queryTokens := tokenize(query)
	if len(queryTokens) == 0 {
		return nil
	}
	queryPrimary := firstWord(query)

	var best *matchResult
	for i := range idx.foods {
		f := &idx.foods[i]
		if len(f.tokens) == 0 {
			continue
		}
		if queryPrimary != "" && f.primaryToken != queryPrimary {
			continue
		}
		if isDenylistedCategory(f.description) {
			continue
		}
		if introducesUnwantedForm(queryTokens, f.tokens) {
			continue
		}
		overlap := 0
		for t := range queryTokens {
			if f.tokens[t] {
				overlap++
			}
		}
		if overlap < len(queryTokens) {
			continue // candidate doesn't cover every query token
		}
		// Extra tokens beyond the query count against the score — except
		// generic/broadening words ("all commercial varieties", "or",
		// "and"). Without this, USDA's genuinely-generic entry
		// ("Oranges, raw, all commercial varieties") scores *worse* than a
		// narrow regional one ("Oranges, raw, Florida") purely for being
		// wordier, which is backwards: the specific variety is the one that
		// should need to earn extra tokens.
		extra := 0
		for t := range f.tokens {
			if queryTokens[t] || genericFillerWords[t] {
				continue
			}
			extra++
		}
		score := float64(overlap) / float64(len(queryTokens)+extra)
		if score < minScore {
			continue
		}
		if best == nil || score > best.score {
			best = &matchResult{fdcID: f.fdcID, score: score, food: f}
		}
	}
	return best
}

func isDenylistedCategory(description string) bool {
	lower := strings.ToLower(description)
	for _, bad := range categoryDenylist {
		if strings.Contains(lower, bad) {
			return true
		}
	}
	return false
}

var tokenSplitter = regexp.MustCompile(`[^a-z0-9]+`)
var parentheticalPattern = regexp.MustCompile(`\([^)]*\)`)

// stripNoise drops parenthetical asides — USDA descriptions often carry
// administrative notes like "(Includes foods for USDA's Food Distribution
// Program)" that add many extra tokens but say nothing about what the food
// actually is; counting them against the match score only punishes correct
// matches (e.g. plain "Orange juice, raw (Includes ...)" scoring worse than
// a less-relevant but shorter description).
func stripNoise(s string) string {
	return parentheticalPattern.ReplaceAllString(s, "")
}

func tokenize(s string) map[string]bool {
	parts := tokenSplitter.Split(strings.ToLower(stripNoise(s)), -1)
	out := make(map[string]bool, len(parts))
	for _, p := range parts {
		if p = stem(p); p != "" {
			out[p] = true
		}
	}
	return out
}

// stem is a deliberately tiny heuristic (not a real stemmer): it strips a
// trailing plural "s" so "apple"/"apples" and "orange"/"oranges" compare
// equal. It does NOT special-case "es" as its own suffix — that would turn
// "oranges" into "orang" instead of "orange" (mangling any word that's
// already base+"e" pluralized with just "s", which covers most fruit/veg
// names). The output doesn't need to be a real English word, only
// consistent between the query and the USDA description being compared.
func stem(w string) string {
	if len(w) > 3 && strings.HasSuffix(w, "s") && !strings.HasSuffix(w, "ss") {
		return strings.TrimSuffix(w, "s")
	}
	return w
}

// loadUSDAIndex downloads (if not already cached under dataDir) and parses
// the SR Legacy bulk dataset into an in-memory search index.
func loadUSDAIndex(dataDir string) (*usdaIndex, error) {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}
	zipPath := filepath.Join(dataDir, "sr_legacy.zip")
	extractDir := filepath.Join(dataDir, "extracted")

	if _, err := os.Stat(zipPath); os.IsNotExist(err) {
		if err := downloadFile(usdaDatasetURL, zipPath); err != nil {
			return nil, fmt.Errorf("download USDA dataset: %w", err)
		}
	}

	root, err := ensureExtracted(zipPath, extractDir)
	if err != nil {
		return nil, err
	}

	nutrientIDToNbr, err := loadNutrientMap(filepath.Join(root, "nutrient.csv"))
	if err != nil {
		return nil, fmt.Errorf("load nutrient.csv: %w", err)
	}

	foodsByID, order, err := loadFoodDescriptions(filepath.Join(root, "food.csv"))
	if err != nil {
		return nil, fmt.Errorf("load food.csv: %w", err)
	}

	if err := loadFoodNutrients(filepath.Join(root, "food_nutrient.csv"), nutrientIDToNbr, foodsByID); err != nil {
		return nil, fmt.Errorf("load food_nutrient.csv: %w", err)
	}

	idx := &usdaIndex{foods: make([]usdaFood, 0, len(order))}
	for _, id := range order {
		idx.foods = append(idx.foods, *foodsByID[id])
	}
	return idx, nil
}

func downloadFile(url, destPath string) error {
	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}

	tmp := destPath + ".part"
	out, err := os.Create(tmp)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, resp.Body); err != nil {
		out.Close()
		os.Remove(tmp)
		return err
	}
	out.Close()
	return os.Rename(tmp, destPath)
}

// ensureExtracted unzips into extractDir on first run and returns the path
// to the folder that actually contains food.csv (the zip wraps everything
// in a dated subfolder whose exact name we don't hardcode).
func ensureExtracted(zipPath, extractDir string) (string, error) {
	if matches, _ := filepath.Glob(filepath.Join(extractDir, "*", "food.csv")); len(matches) > 0 {
		return filepath.Dir(matches[0]), nil
	}

	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return "", err
	}
	defer r.Close()

	for _, f := range r.File {
		destPath := filepath.Join(extractDir, f.Name)
		if !strings.HasPrefix(destPath, filepath.Clean(extractDir)+string(os.PathSeparator)) {
			continue // guard against zip-slip
		}
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(destPath, 0o755); err != nil {
				return "", err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(destPath), 0o755); err != nil {
			return "", err
		}
		if err := extractZipFile(f, destPath); err != nil {
			return "", err
		}
	}

	matches, err := filepath.Glob(filepath.Join(extractDir, "*", "food.csv"))
	if err != nil {
		return "", err
	}
	if len(matches) == 0 {
		return "", fmt.Errorf("food.csv not found after extracting %s", zipPath)
	}
	return filepath.Dir(matches[0]), nil
}

func extractZipFile(f *zip.File, destPath string) error {
	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	out, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, rc)
	return err
}

func csvHeaderIndex(header []string) map[string]int {
	m := make(map[string]int, len(header))
	for i, h := range header {
		m[strings.TrimSpace(h)] = i
	}
	return m
}

func loadNutrientMap(path string) (map[string]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	header, err := r.Read()
	if err != nil {
		return nil, err
	}
	col := csvHeaderIndex(header)
	idIdx, nbrIdx := col["id"], col["nutrient_nbr"]

	out := map[string]string{}
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		out[rec[idIdx]] = rec[nbrIdx]
	}
	return out, nil
}

func loadFoodDescriptions(path string) (map[string]*usdaFood, []string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.LazyQuotes = true
	header, err := r.Read()
	if err != nil {
		return nil, nil, err
	}
	col := csvHeaderIndex(header)
	idIdx, descIdx := col["fdc_id"], col["description"]

	byID := map[string]*usdaFood{}
	order := make([]string, 0, 8000)
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, nil, err
		}
		id := rec[idIdx]
		desc := rec[descIdx]
		byID[id] = &usdaFood{
			fdcID:        id,
			description:  desc,
			primaryToken: firstWord(desc),
			tokens:       tokenize(desc),
			nutrients:    map[string]float64{},
		}
		order = append(order, id)
	}
	return byID, order, nil
}

func loadFoodNutrients(path string, nutrientIDToNbr map[string]string, foodsByID map[string]*usdaFood) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.LazyQuotes = true
	header, err := r.Read()
	if err != nil {
		return err
	}
	col := csvHeaderIndex(header)
	fdcIdx, nutIdx, amtIdx := col["fdc_id"], col["nutrient_id"], col["amount"]

	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		field, wanted := targetNutrientFields[nutrientIDToNbr[rec[nutIdx]]]
		if !wanted {
			continue
		}
		food, ok := foodsByID[rec[fdcIdx]]
		if !ok {
			continue
		}
		amountStr := strings.TrimSpace(rec[amtIdx])
		if amountStr == "" {
			continue
		}
		amount, err := strconv.ParseFloat(amountStr, 64)
		if err != nil {
			continue
		}
		food.nutrients[field] = amount
	}
	return nil
}
