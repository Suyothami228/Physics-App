from django.test import TestCase
from django.core.management import call_command
from learning.models import Lesson

class GraphTests(TestCase):
    def test_graphs_order_and_preservation(self):
        call_command('seed_content')
        order=list(Lesson.objects.filter(chapter_id='02').order_by('position').values_list('id',flat=True))
        self.assertEqual(order[:3],['02/vectors','02/velocity','02/graphs'])
        lesson=Lesson.objects.get(pk='02/graphs')
        self.assertTrue(lesson.available)
        self.assertEqual(lesson.blocks.count(),23)
        self.assertEqual(lesson.blocks.filter(kind='activity').count(),4)
        self.assertEqual(lesson.blocks.filter(kind='check').count(),8)
        for block in lesson.blocks.all():
            block.full_clean()
        block=lesson.blocks.first()
        block.body_en='Educator revision'
        block.save()
        call_command('seed_content')
        block.refresh_from_db()
        self.assertEqual(block.body_en,'Educator revision')
        self.assertEqual(list(Lesson.objects.filter(chapter_id='02').order_by('position').values_list('id',flat=True)),order)
