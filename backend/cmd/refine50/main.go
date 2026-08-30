package main

import (
	"context"
	"flag"
	"log"
	"os"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/service/ai"
)

func main() {
	inPath := flag.String("in", "", "layer-8 JSON from fa-calorie-api/test/build_gemini_layer8.py")
	outPath := flag.String("out", "", "Gemini refine report JSON")
	flag.Parse()
	if stringsEmpty(*inPath, *outPath) {
		log.Fatal("usage: refine50 -in layer8.json -out report.json")
	}
	if err := config.Load(); err != nil {
		log.Fatalf("config: %v", err)
	}
	if err := ai.RunGeminiRefine50(context.Background(), *inPath, *outPath); err != nil {
		log.Fatal(err)
	}
	os.Exit(0)
}

func stringsEmpty(vals ...string) bool {
	for _, v := range vals {
		if v == "" {
			return true
		}
	}
	return false
}
