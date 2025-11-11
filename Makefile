.PHONY: help backend frontend dev install clean

help:
	@echo "Available targets:"
	@echo "  make install    - Install dependencies for both backend and frontend"
	@echo "  make backend    - Run the backend server (Flask)"
	@echo "  make frontend   - Run the frontend development server (Next.js)"
	@echo "  make dev        - Run both backend and frontend concurrently"
	@echo "  make clean      - Clean build artifacts and caches"

install:
	@echo "Installing backend dependencies..."
	uv sync
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✓ Installation complete!"

backend:
	@echo "Starting Flask backend on http://localhost:5000..."
	cd backend && uv run flask run --host=0.0.0.0 --port=5000

frontend:
	@echo "Starting Next.js frontend on http://localhost:3000..."
	cd frontend && npm run dev

dev:
	@echo "Starting both backend and frontend..."
	@make -j2 backend frontend

clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/.next
	rm -rf frontend/node_modules/.cache
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	@echo "✓ Clean complete!"
