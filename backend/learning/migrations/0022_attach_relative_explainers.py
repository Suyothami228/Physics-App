from django.db import migrations

def attach(apps,schema_editor):
    Block=apps.get_model('learning','LessonBlock')
    for key,explainer in [('relative-observer','relative-observer'),('relative-opposite-bank','relative-river')]:
        Block.objects.filter(lesson_id='02/relative',key=key,explainer='',video_url='').update(explainer=explainer)

class Migration(migrations.Migration):
    dependencies=[('learning','0021_lessonblock_explainer_lessonblock_video_steps_and_more')]
    operations=[migrations.RunPython(attach,migrations.RunPython.noop)]
