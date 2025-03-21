# This does not work yet. Just testing stuff out
FROM python:3.11-slim

WORKDIR /app

COPY . /app/
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update && apt-get install -y make

ENV FLASK_ENV=development
ENV FLASK_APP=app.py

EXPOSE 8001

CMD ["python", "app.py"]
