# Образ собирается явно, а не угадывается: для звонков нужен ffmpeg,
# нативные колёса ntgcalls требуют совместимой glibc, а расписание по
# Ташкенту — базы часовых поясов, которой в slim-образе нет.
FROM python:3.12-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates tzdata \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src

ENV PYTHONUNBUFFERED=1
CMD ["python", "-m", "src.main"]
