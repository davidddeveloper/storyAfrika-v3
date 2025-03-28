#!/bin/bash

# Create a new tmux session and start Gunicorn
tmux new-session -d -s gunicorn 'gunicorn --bind 0.0.0.0:8000 --workers 3 ../storyafrika.wsgi'