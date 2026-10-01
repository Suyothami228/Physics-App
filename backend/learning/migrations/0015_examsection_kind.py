from django.db import migrations, models


def add_instrument_section(apps, schema_editor):
    Chapter = apps.get_model('learning', 'Chapter')
    Section = apps.get_model('learning', 'ExamSection')
    if Chapter.objects.filter(pk='01').exists():
        Section.objects.get_or_create(chapter_id='01', slug='measuring-instruments', defaults={
            'kind': 'mcq', 'title_en': 'Measuring Instruments', 'title_ta': 'அளவிடும் கருவிகள்',
        })


class Migration(migrations.Migration):
    dependencies = [('learning', '0014_alter_examquestion_options_and_more')]
    operations = [
        migrations.AddField(model_name='examsection', name='kind', field=models.CharField(max_length=12, default='mcq', choices=[('mcq','MCQ'),('structured','Structured'),('essay','Essay')])),
        migrations.RunPython(add_instrument_section, migrations.RunPython.noop),
    ]
