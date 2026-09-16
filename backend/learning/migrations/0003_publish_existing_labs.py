from django.db import migrations

def mark_existing_labs(apps,schema_editor):
    apps.get_model('learning','Lesson').objects.filter(available=True,content_status='draft').update(content_status='published')

class Migration(migrations.Migration):
    dependencies=[('learning','0002_lesson_content_status_lessonblock')]
    operations=[migrations.RunPython(mark_existing_labs,migrations.RunPython.noop)]
