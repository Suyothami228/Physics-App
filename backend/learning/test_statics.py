from django.test import TestCase
from django.core.management import call_command
from learning.models import Lesson
class StaticsTests(TestCase):
    def test_seed_order_validation_and_preservation(self):
        call_command('seed_content')
        lesson=Lesson.objects.get(pk='02/statics')
        self.assertEqual(lesson.position,Lesson.objects.get(pk='02/relative').position+1)
        self.assertEqual(lesson.blocks.count(),31)
        for block in lesson.blocks.all(): block.full_clean()
        first=lesson.blocks.first();first.body_ta='Educator correction';first.save()
        call_command('seed_statics')
        first.refresh_from_db();self.assertEqual(first.body_ta,'Educator correction')
        self.assertEqual(lesson.blocks.count(),31)
        self.assertEqual(len(self.client.get('/api/lessons/02/statics/').json()['blocks']),31)
