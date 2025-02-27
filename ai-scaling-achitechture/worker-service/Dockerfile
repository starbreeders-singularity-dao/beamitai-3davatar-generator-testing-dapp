# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the worker service code into the container
COPY worker.py .

# (Optional) Expose a port if needed; not required for background processing
EXPOSE 8080

# Run the worker service
CMD ["python", "worker.py"]
