from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission


class Command(BaseCommand):
    help = 'Create educator and technical admin groups; never assigns users automatically.'

    def handle(self, *args, **options):
        for name, codes in [('Educators',['publish_wording']),('Technical admins',['publish_wording','manage_feedback'])]:
            group,_ = Group.objects.get_or_create(name=name)
            group.permissions.add(*Permission.objects.filter(content_type__app_label='learning',codename__in=codes))
        self.stdout.write('Review roles ready. A superuser can assign existing users in Django admin. Educators do not need staff status.')
