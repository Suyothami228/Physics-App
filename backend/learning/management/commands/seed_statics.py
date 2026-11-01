import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import Chapter, Lesson, LessonBlock

class Command(BaseCommand):
    help = 'Add Statics after Relative velocity in Mechanics without replacing educator edits'

    @transaction.atomic
    def handle(self, *args, **options):
        chapter, _ = Chapter.objects.get_or_create(id='02', defaults={'title_en':'Mechanics','title_ta':'பொறியியல்'})
        lesson, _ = Lesson.objects.get_or_create(id='02/statics', defaults={
            'chapter':chapter,'title_en':'Statics','title_ta':'நிலையியல்',
            'position':3,'available':True,'content_status':'published','metadata':{'slug':'statics'},
        })
        if not lesson.metadata.get('statics_seeded'):
            ordered=list(Lesson.objects.filter(chapter=chapter).exclude(pk=lesson.pk).order_by('position','id'))
            index=next((i+1 for i,item in enumerate(ordered) if item.pk=='02/relative'),min(3,len(ordered)))
            ordered.insert(index,lesson)
            for position,item in enumerate(ordered):
                item.position=position
                item.save(update_fields=['position'])
            lesson.metadata={**lesson.metadata,'statics_seeded':True}
            lesson.available=True
            lesson.content_status='published'
            lesson.save(update_fields=['metadata','available','content_status'])
        rows=json.loads((settings.BASE_DIR/'seed/statics.json').read_text(encoding='utf8'))['02/statics']
        count=0
        for row in rows:
            if lesson.blocks.filter(key=row['key']).exists():
                continue
            block=LessonBlock(lesson=lesson,**row)
            block.full_clean()
            block.save()
            count+=1
        self.stdout.write(f'Statics ready: {count} blocks added; existing educator edits preserved.')
