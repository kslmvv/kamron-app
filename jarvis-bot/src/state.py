"""
Что бот помнит между перезапусками.

Контейнер на Railway переживает деплой, но не хранит память, поэтому
владелец, расход за день и отметки об отправленных сводках лежат на диске.
Без этого после каждого деплоя бот забывал бы, кому он принадлежит, и
обнулял бы счётчик расхода — ровно та ошибка, на которой мы уже горели
с расписанием звонков.
"""
import json
import logging
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from .config import config

log = logging.getLogger("state")


def _zone():
    try:
        return ZoneInfo(config.timezone)
    except Exception:
        return ZoneInfo("UTC")


class State:
    def __init__(self) -> None:
        self.path = os.path.join(config.data_dir, "bot.json")
        self.owner: int | None = None
        self.day = ""
        self.cost = 0.0
        self.messages = 0
        self.fired: list[str] = []
        self.update_id = 0
        self.history: list[dict] = []
        self.persistent = False
        self._load()

    # ── диск ────────────────────────────────────────────────────────────
    def _load(self) -> None:
        try:
            with open(self.path, encoding="utf-8") as f:
                raw = json.load(f)
            self.owner = raw.get("owner")
            self.day = raw.get("day", "")
            self.cost = float(raw.get("cost", 0.0))
            self.messages = int(raw.get("messages", 0))
            self.fired = list(raw.get("fired", []))
            self.update_id = int(raw.get("update_id", 0))
            self.history = list(raw.get("history", []))
            self.persistent = True
        except FileNotFoundError:
            self.persistent = os.path.isdir(config.data_dir)
        except Exception as error:
            log.warning("Состояние не прочитано: %s", error)

    def save(self) -> None:
        try:
            os.makedirs(config.data_dir, exist_ok=True)
            tmp = self.path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "owner": self.owner,
                        "day": self.day,
                        "cost": round(self.cost, 6),
                        "messages": self.messages,
                        "fired": self.fired,
                        "update_id": self.update_id,
                        "history": self.history[-20:],
                    },
                    f,
                    ensure_ascii=False,
                )
            os.replace(tmp, self.path)
            self.persistent = True
        except Exception as error:
            self.persistent = False
            log.warning("Состояние не записано: %s", error)

    # ── сутки ───────────────────────────────────────────────────────────
    def today(self) -> str:
        return datetime.now(_zone()).strftime("%Y-%m-%d")

    def roll(self) -> None:
        """Новый день — счётчики с нуля, отметки об отправленном сбрасываются."""
        day = self.today()
        if day != self.day:
            self.day = day
            self.cost = 0.0
            self.messages = 0
            self.fired = []
            self.history = []
            self.save()

    def left(self) -> float:
        return max(0.0, config.max_day_cost - self.cost)

    def can_spend(self) -> bool:
        self.roll()
        return self.cost < config.max_day_cost

    def spend(self, amount: float, what: str) -> None:
        self.roll()
        self.cost += max(0.0, amount)
        log.info("Расход %s: +$%.5f, за сутки $%.4f", what, amount, self.cost)
        self.save()

    # ── сводки ──────────────────────────────────────────────────────────
    def was_fired(self, name: str) -> bool:
        self.roll()
        return name in self.fired

    def mark_fired(self, name: str) -> None:
        self.roll()
        if name not in self.fired:
            self.fired.append(name)
            self.save()

    # ── переписка ───────────────────────────────────────────────────────
    def remember(self, role: str, text: str) -> None:
        """Короткая память разговора: нужна, чтобы «а во сколько?» имело смысл."""
        self.history.append({"role": role, "content": text[:1500]})
        self.history = self.history[-20:]
        self.save()


state = State()
