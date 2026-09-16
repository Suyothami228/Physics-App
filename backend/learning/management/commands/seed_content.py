import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from learning.models import Chapter, Lesson, Question


class Command(BaseCommand):
    help = "Import missing prototype content without overwriting educator edits."

    @transaction.atomic
    def handle(self, *args, **options):
        data = json.loads((settings.BASE_DIR / "seed" / "content.json").read_text(encoding="utf-8"))
        for row in data["chapters"]:
            chapter, _ = Chapter.objects.get_or_create(id=row["id"], defaults={
                "title_en": row["en"], "title_ta": row["ta"],
                "metadata": {k: v for k, v in row.items() if k not in {"id", "en", "ta", "lessons"}},
            })
            for lesson in row["lessons"]:
                Lesson.objects.get_or_create(id=lesson["id"], defaults={
                    "chapter": chapter, "title_en": lesson["en"], "title_ta": lesson["ta"],
                    "position": lesson["index"], "available": lesson["available"],
                    "content_status": "published" if lesson["available"] else "draft",
                    "metadata": {k: v for k, v in lesson.items() if k not in {"id", "en", "ta", "index", "available"}},
                })
        for question in data["questions"]:
            Question.objects.get_or_create(id=f'{question["id"]}:{question["variant"]}', defaults={
                "lesson_id": "02/projectile", "style": question["id"], "variant": question["variant"],
                "family": question["family"], "content": question,
            })
        call_command("seed_measurement")
        self.stdout.write(self.style.SUCCESS("Content ready: existing rows preserved."))
