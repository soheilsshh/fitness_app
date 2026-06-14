package seed

import "embed"

//go:embed fixtures/*.json
var fixtures embed.FS
