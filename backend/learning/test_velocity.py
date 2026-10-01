from django.test import TestCase
from django.core.management import call_command
from learning.models import Lesson

class VelocityTests(TestCase):
    def test_seed_is_bilingual_admin_editable_and_preserves_edits(self):
        call_command('seed_velocity')
        lesson = Lesson.objects.get(pk='02/velocity')
        self.assertTrue(lesson.available)
        self.assertEqual(lesson.blocks.count(),24)
        for block in lesson.blocks.all():
            block.full_clean()
        block = lesson.blocks.get(key='velocity-basics')
        block.body_en = 'Educator revision'
        block.save()
        call_command('seed_velocity')
        block.refresh_from_db()
        self.assertEqual(block.body_en,'Educator revision')
        self.assertEqual(lesson.blocks.count(),24)
