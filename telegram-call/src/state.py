"""
Память сервиса между перезапусками.

Счётчики в памяти процесса — не предохранитель: контейнер перезапускается
при каждом деплое, и вместе с ним обнулялись и дневная квота, и отметки
о сделанных звонках. Один такой перезапуск внутри окна расписания уже
привёл к повторному звонку.

Поэтому дневное состояние лежит на диске. Если тома нет, работаем из
памяти и говорим об этом прямо: лучше знать, что защиты нет, чем считать,
что она есть.
"""
import json
import logging
import os
from datetime import date

log = logging.getLogger("state")

DIR = os.environ.get("DATA_DIR", "/data")
FILE = os.path.join(DIR, "calls.json")


class DailyState:
    def __init__(self) -> None:
        self.day = ""
        self.calls = 0
        self.cost = 0.0
        self.fired: set[str] = set()
        self.persistent = False
        self._read()

    def _read(self) -> None:
        try:
            with open(FILE, encoding="utf-8") as f:
                raw = json.load(f)
            self.day = str(raw.get("day", ""))
            self.calls = int(raw.get("calls", 0))
            self.cost = float(raw.get("cost", 0.0))
            self.fired = set(raw.get("fired", []))
            self.persistent = True
            log.info("Состояние прочитано: день %s, звонков %d", self.day, self.calls)
        except FileNotFoundError:
            self.persistent = self._writable()
        except Exception as error:  # noqa: BLE001 — битый файл не должен ронять сервис
            log.error("Состояние не прочитано (%s), начинаю с чистого", error)
            self.persistent = self._writable()

    def _writable(self) -> bool:
        try:
            os.makedirs(DIR, exist_ok=True)
            with open(FILE, "w", encoding="utf-8") as f:
                json.dump({}, f)
            return True
        except Exception as error:  # noqa: BLE001 — том может быть не подключён
            log.error("Диск недоступен (%s): защита от повторного звонка в памяти", error)
            return False

    def _write(self) -> None:
        if not self.persistent:
            return
        try:
            os.makedirs(DIR, exist_ok=True)
            with open(FILE, "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "day": self.day,
                        "calls": self.calls,
                        "cost": round(self.cost, 6),
                        "fired": sorted(self.fired),
                    },
                    f,
                )
        except Exception as error:  # noqa: BLE001 — запись не должна ронять звонок
            log.error("Состояние не записано: %s", error)

    def roll(self) -> None:
        today = date.today().isoformat()
        if self.day != today:
            self.day = today
            self.calls = 0
            self.cost = 0.0
            self.fired = set()
            self._write()

    def was_fired(self, kind: str) -> bool:
        self.roll()
        return kind in self.fired

    def mark_fired(self, kind: str) -> None:
        self.roll()
        self.fired.add(kind)
        self._write()

    def add_call(self) -> None:
        self.roll()
        self.calls += 1
        self._write()

    def add_cost(self, dollars: float) -> None:
        self.roll()
        self.cost += dollars
        self._write()


state = DailyState()
