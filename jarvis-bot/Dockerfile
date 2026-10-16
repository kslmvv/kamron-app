# Образ собирается явно: для голосовых нужен ffmpeg (Telegram принимает
# голосовое только в OGG/Opus, а озвучка приходит в WAV), а расписание по
# Ташкенту требует базы часовых поясов, которой в slim-образе нет.
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
