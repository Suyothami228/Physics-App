from django.test import TestCase
from django.core.management import call_command
from learning.models import Chapter, Lesson

class VectorSeedTests(TestCase):
    def test_order_validation_and_admin_preservation(self):
        chapter=Chapter.objects.create(id='02',title_en='Mechanics',title_ta='பொறியியல்')
        Lesson.objects.create(id='02/velocity',chapter=chapter,title_en='Velocity',title_ta='வேகம்',position=0)
        call_command('seed_vectors')
        lesson=Lesson.objects.get(pk='02/vectors')
        self.assertEqual(Lesson.objects.filter(chapter=chapter).order_by('position').first(),lesson)
        self.assertEqual(lesson.blocks.count(),20)
        block=lesson.blocks.first()
        block.body_en='Educator revision'
        block.save()
        call_command('seed_vectors')
        block.refresh_from_db()
        self.assertEqual(block.body_en,'Educator revision')
        for block in lesson.blocks.all():
            block.full_clean()
