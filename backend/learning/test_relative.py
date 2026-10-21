from django.test import TestCase
from django.core.management import call_command
from learning.models import Lesson

class RelativeTests(TestCase):
    def test_seed_preserves_edits_and_order(self):
        call_command('seed_content')
        lesson=Lesson.objects.get(pk='02/relative')
        self.assertEqual(lesson.blocks.count(),17)
        self.assertEqual(lesson.blocks.filter(kind='check').count(),7)
        self.assertEqual(list(Lesson.objects.filter(chapter_id='02').order_by('position').values_list('id',flat=True))[:4],['02/vectors','02/velocity','02/graphs','02/relative'])
        for block in lesson.blocks.all(): block.full_clean()
        block=lesson.blocks.first()
        block.body_en='Educator revision'
        block.save()
        call_command('seed_relative')
        block.refresh_from_db()
        self.assertEqual(block.body_en,'Educator revision')
        self.assertEqual(lesson.blocks.count(),17)
