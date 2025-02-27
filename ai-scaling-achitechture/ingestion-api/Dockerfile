# Use an official Python runtime as a base image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy requirements.txt into the container
COPY requirements.txt .

# Install Python dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Expose port 8080 (Cloud Run expects the container to listen on this port)
EXPOSE 8080

# Set an environment variable for the port (optional)
ENV PORT 8080

# Run the application
CMD ["python", "main.py"]
