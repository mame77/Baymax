package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type statusResponse struct {
	Service string `json:"service"`
	Status  string `json:"status"`
}

func main() {
	addr := ":" + port()

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}

		writeJSON(w, http.StatusOK, statusResponse{
			Service: "baymax-api",
			Status:  "ok",
		})
	})
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, statusResponse{
			Service: "baymax-api",
			Status:  "ok",
		})
	})

	log.Printf("baymax api listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func port() string {
	if value := os.Getenv("PORT"); value != "" {
		return value
	}
	return "8080"
}

func writeJSON(w http.ResponseWriter, status int, response statusResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
