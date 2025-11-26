.PHONY: help dev install clean

help:
	@echo "Available targets:"
	@echo "  make install    - Install frontend dependencies"
	@echo "  make dev        - Run the frontend development server (Next.js)"
	@echo "  make clean      - Clean build artifacts and caches"

install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✓ Installation complete!"

dev:
	@echo "Starting Next.js frontend on http://localhost:3000..."
	cd frontend && npm run dev

clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/.next
	rm -rf frontend/node_modules/.cache
	@echo "✓ Clean complete!"
