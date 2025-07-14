# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Install system dependencies required for psycopg2-binary (if using PostgreSQL)
# or default-libmysqlclient-dev (if using MySQL) and build tools.
# This assumes you are using a database that requires these headers for its Python client.
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    # Add any other system dependencies your app might need, e.g., libpq-dev for PostgreSQL
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy only requirements.txt first to leverage Docker cache
COPY requirements.txt /app/
# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your Django project into the container
COPY . /app/

# Collect static files (important for Django in production)
# --noinput prevents prompts for confirmation
RUN python manage.py collectstatic --noinput

# Expose the port your Django app will listen on.
# App Runner typically expects applications to listen on port 8080 by default,
# but you can configure it to use 8000. It's good practice to explicitly expose.
EXPOSE 8000

# Define the command to run your Django application using Gunicorn.
# This is the default command if no start command is specified in App Runner.
# Replace 'yourprojectname.wsgi:application' with your actual WSGI file path.
# For example, if your project folder is 'myproject', it would be 'myproject.wsgi:application'.
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "yourprojectname.wsgi:application"]
