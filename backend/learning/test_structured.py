import json
import os
from io import BytesIO
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from .models import Chapter, ExamQuestion


class StructuredTests(TestCase):
    def setUp(self):
        Chapter.objects.create(id='01', title_en='Measurement', title_ta='அளவீடு')
        call_command('import_measurement_structured')
        self.q = ExamQuestion.objects.filter(kind='structured').first()
        self.user = get_user_model().objects.create_user('photo-student', password='test-only')
        cache.clear()

    def test_import_all_parts_is_idempotent_and_answers_are_separate(self):
        call_command('import_measurement_structured')
        self.assertEqual(ExamQuestion.objects.count(), 4)
        self.assertEqual(sum(len(q.structured_parts) for q in ExamQuestion.objects.all()), 34)
        response = self.client.get('/api/exam/questions/?chapter=01&kind=structured').json()
        self.assertEqual(response['years'], [2024])
        self.assertEqual(response['questions'][0]['year'], 2024)
        for q in response['questions']:
            for part in q['parts']:
                self.assertNotIn('answer', part)
            solution = self.client.get(f"/api/exam/solutions/{q['id']}/").json()
            self.assertEqual(len(solution['parts']),len(q['parts']))

    @patch.dict(os.environ, {'OPENAI_API_KEY':'test-key', 'OPENAI_VISION_MODEL':'test-model'})
    @patch('learning.photo_marking.urlopen')
    def test_photo_requires_login_consent_and_valid_image(self, upstream):
        url = f'/api/exam/photo-marking/{self.q.pk}/'
        self.assertEqual(self.client.post(url).status_code,401)
        self.client.force_login(self.user)
        self.assertEqual(self.client.post(url,{'part':'a'}).status_code,400)
        self.assertEqual(self.client.post(url,{'part':'a','consent':'yes','photo':SimpleUploadedFile('bad.png',b'not an image')}).status_code,400)
        upstream.assert_not_called()

    @patch.dict(os.environ, {'OPENAI_API_KEY':'test-key', 'OPENAI_VISION_MODEL':'test-model'})
    @patch('learning.photo_marking.urlopen')
    def test_photo_feedback_uses_server_reference_and_no_storage(self, upstream):
        self.client.force_login(self.user)
        upstream.return_value.__enter__.return_value = BytesIO(json.dumps({'status':'completed','output':[{'content':[{'type':'output_text','text':'Provisional feedback'}]}]}).encode())
        def data():
            return {'part':'a','consent':'yes','language':'ta','photo':SimpleUploadedFile('answer.png',b'\x89PNG\r\n\x1a\nexample')}
        url = f'/api/exam/photo-marking/{self.q.pk}/'
        result=self.client.post(url,data())
        self.assertEqual(result.status_code,200)
        self.assertTrue(result.json()['provisional'])
        body=json.loads(upstream.call_args.args[0].data)
        self.assertFalse(body['store'])
        self.assertIn('selected_part',body['input'][0]['content'][0]['text'])
        self.assertEqual(self.client.post(url,data()).status_code,429)
