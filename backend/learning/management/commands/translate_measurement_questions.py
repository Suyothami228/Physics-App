"""Apply reviewed English translations without overwriting educator edits."""
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from learning.models import ExamQuestion


def read_tsv(path):
    rows = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        number, prompt, options = line.split('\t')
        rows[int(number)] = (prompt.replace('\\n', '\n'), options.replace('|', '\n'))
    return rows


class Command(BaseCommand):
    help = 'Fill missing English translations for the supplied measurement question banks'

    @transaction.atomic
    def handle(self, *args, **options):
        learning = Path(__file__).resolve().parents[2]
        seed = learning.parent / 'seed'
        tamil = read_tsv(learning / 'data/measurement_mcq/typed.tsv')
        english = read_tsv(learning / 'data/measurement_mcq/english.tsv')
        if set(english) != set(tamil):
            raise CommandError('English and Tamil MCQ source numbers must match.')
        updated = 0
        for number, (prompt, choices) in english.items():
            q = ExamQuestion.objects.filter(import_key=f'measurement-mcq-v1-{number:02}').first()
            if not q:
                continue
            changed = False
            for field, value, source in [('prompt', prompt, tamil[number][0]), ('options', choices, tamil[number][1])]:
                current = getattr(q, f'{field}_en')
                if getattr(q, f'{field}_ta') == source and (not current or current == source):
                    if current != value:
                        setattr(q, f'{field}_en', value)
                        changed = True
            if changed:
                q.full_clean()
                q.save()
                updated += 1
        originals = {r['key']: r for r in json.loads((seed / 'measurement-structured.json').read_text(encoding='utf-8'))}
        translations = json.loads((seed / 'measurement-structured-en.json').read_text(encoding='utf-8'))
        for row in translations:
            q = ExamQuestion.objects.filter(import_key=row['key']).first()
            if not q:
                continue
            original = originals[row['key']]
            changed = False
            for field in ('title', 'prompt'):
                current = getattr(q, f'{field}_en')
                if getattr(q, f'{field}_ta') == original[field] and (not current or current == original[field]):
                    if current != row[field]:
                        setattr(q, f'{field}_en', row[field])
                        changed = True
            source_parts = {p['id']: p for p in original['parts']}
            translated_parts = {p['id']: p for p in row['parts']}
            for part in q.structured_parts:
                part_id = part['id']
                if part_id not in source_parts or part_id not in translated_parts:
                    continue
                for field in ('prompt', 'answer'):
                    text = part[field]
                    source = source_parts[part_id][field]['ta']
                    if text.get('ta') == source and (not text.get('en') or text['en'] == source):
                        value = translated_parts[part_id][field]
                        if text.get('en') != value:
                            text['en'] = value
                            changed = True
            if changed:
                q.full_clean()
                q.save()
                updated += 1
        self.stdout.write(self.style.SUCCESS(f'Updated English translations on {updated} questions; existing educator translations preserved.'))
