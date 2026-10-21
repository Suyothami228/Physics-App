from django.test import TestCase
from django.core.management import call_command
from django.core.exceptions import ValidationError
from learning.models import LessonBlock

class ExplainerTests(TestCase):
    def setUp(self):
        call_command('seed_content')
        self.block=LessonBlock.objects.get(lesson_id='02/relative',key='relative-observer')

    def test_caption_validation(self):
        self.block.video_steps=[{'time':0,'en':'English','ta':'தமிழ்'},{'time':4,'en':'Next','ta':'அடுத்து'}]
        self.block.full_clean()
        self.block.video_steps[1]['time']=0
        with self.assertRaises(ValidationError): self.block.full_clean()

    def test_api_exposes_selected_explainer(self):
        data=self.client.get('/api/lessons/02%2Frelative/').json()
        row=next(b for b in data['blocks'] if b['key']=='relative-observer')
        self.assertEqual(row['explainer'],'relative-observer')
        self.assertEqual(row['video_steps'],[])
