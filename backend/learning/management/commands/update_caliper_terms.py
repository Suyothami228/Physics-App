import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import LessonBlock

TERMS = [('வேர்னியர் அளவி', 'வேணியர் இடுக்கிமானி'), ('வேர்னி', 'வேணி'), ('சிற்றளவு', 'இழிவெண்ணிக்கை'), ('முதன்மை அளவு', 'பிரதான அளவிடை'), ('முதன்மை வாசிப்பு', 'பிரதான அளவிடை வாசிப்பு'), ('முதன்மைப் பிரிவு', 'பிரதான பிரிவு'), ('வேர்னியர் அளவு', 'வேணியர் அளவிடை'), ('ஆழத் தண்டு', 'ஆழம் அளக்கும் கோல்')]

class Command(BaseCommand):
    help = 'Apply reference Tamil terms to vernier blocks without replacing educator content.'
    @transaction.atomic
    def handle(self,*args,**options):
        count = 0
        for block in LessonBlock.objects.filter(lesson_id='01/instruments',instrument='vernier'):
            changed=[]
            for field in ['title_ta','body_ta','options_ta','explanation_ta']:
                value=getattr(block,field)
                for old,new in TERMS:
                    value=value.replace(old,new)
                if value != getattr(block,field):
                    setattr(block,field,value)
                    changed.append(field)
            if changed:
                block.save(update_fields=changed)
                count+=1
        self.stdout.write(f'Updated Tamil terminology in {count} vernier blocks; other content preserved.')
