import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import Chapter, Lesson, LessonBlock


class Command(BaseCommand):
    help = 'Add the bilingual Velocity lesson and activities, preserving admin edits'

    def add_arguments(self, parser):
        parser.add_argument('--refresh', action='store_true', help='Replace matching Velocity blocks with the reviewed source edition')

    @transaction.atomic
    def handle(self, *args, **options):
        chapter, _ = Chapter.objects.get_or_create(id='02', defaults={'title_en':'Mechanics','title_ta':'பொறியியல்'})
        lesson, _ = Lesson.objects.get_or_create(id='02/velocity', defaults={
            'chapter':chapter, 'title_en':'Velocity', 'title_ta':'வேகம்', 'position':0,
            'available':True, 'content_status':'published', 'metadata':{'slug':'velocity'},
        })
        rows = json.loads((settings.BASE_DIR / 'seed/velocity.json').read_text(encoding='utf8'))['02/velocity']
        added = 0
        for row in rows:
            if lesson.blocks.filter(key=row['key']).exists():
                if options['refresh']:
                    block = lesson.blocks.get(key=row['key'])
                    for field, value in row.items():
                        setattr(block, field, value)
                    block.full_clean()
                    block.save()
                continue
            block = LessonBlock(lesson=lesson, **row)
            block.full_clean()
            block.save()
            added += 1
        action = 'matching blocks refreshed from source' if options['refresh'] else 'existing admin edits preserved'
        self.stdout.write(f'Velocity ready: {added} blocks added; {action}.')
