from django import forms
from django.contrib import admin
from .models import Chapter, Lesson, Question, Attempt, LessonBlock

admin.site.site_header = 'Iyal Physics · Content studio'
admin.site.site_title = 'Iyal admin'
admin.site.index_title = 'Manage chapters, lessons and learning activities'

class ChapterForm(forms.ModelForm):
    description_en = forms.CharField(widget=forms.Textarea(attrs={'rows':3}), required=False)
    description_ta = forms.CharField(widget=forms.Textarea(attrs={'rows':3}), required=False)
    formula = forms.CharField(required=False)
    color = forms.RegexField(r'^#[0-9a-fA-F]{6}$', initial='#5465ed')
    source = forms.URLField(required=False)
    slug = forms.SlugField()
    class Meta:
        model = Chapter
        fields = ['id','title_en','title_ta']
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        m=self.instance.metadata or {}
        for field in ['formula','color','source','slug']:
            self.fields[field].initial=m.get(field,self.fields[field].initial)
        for lang in ['en','ta']:
            self.fields['description_'+lang].initial=m.get('description',{}).get(lang,'')
    def save(self,commit=True):
        obj=super().save(commit=False)
        obj.metadata={**(obj.metadata or {}),**{k:self.cleaned_data[k] for k in ['formula','color','source','slug']},'description':{lang:self.cleaned_data['description_'+lang] for lang in ['en','ta']}}
        if commit: obj.save()
        return obj

class LessonForm(forms.ModelForm):
    slug = forms.SlugField(help_text='URL segment. Keep existing slugs stable.')
    class Meta:
        model=Lesson
        fields=['id','chapter','title_en','title_ta','position','content_status']
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.fields['slug'].initial=(self.instance.metadata or {}).get('slug','')
    def clean(self):
        data=super().clean()
        chapter=data.get('chapter') or (self.instance.chapter if self.instance.pk else None)
        lesson_id=data.get('id') or self.instance.pk
        if chapter and lesson_id and data.get('slug') and lesson_id != f"{chapter.pk}/{data['slug']}":
            raise forms.ValidationError('Lesson ID must be chapter ID/slug, e.g. 01/quantities. Existing IDs must stay stable.')
        return data
    def save(self,commit=True):
        obj=super().save(commit=False)
        obj.metadata={**(obj.metadata or {}),'slug':self.cleaned_data['slug']}
        if commit: obj.save()
        return obj

class LessonInline(admin.TabularInline):
    model=Lesson
    fields=['title_en','title_ta','position','content_status']
    extra=0
    show_change_link=True
    def has_add_permission(self,request,obj=None): return False

class BlockInline(admin.StackedInline):
    model=LessonBlock
    extra=0
    fields=[('key','position','kind','published'),('title_en','title_ta'),'instrument','presentation','body_en','body_ta','formula','activity','options_en','options_ta','correct_option','explanation_en','explanation_ta']

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    form=ChapterForm
    list_display=['id','title_en','title_ta']
    search_fields=['title_en','title_ta']
    inlines=[LessonInline]
    fields=['id','slug','title_en','title_ta','description_en','description_ta','formula','color','source']
    def get_readonly_fields(self,request,obj=None): return ['id'] if obj else []

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    form=LessonForm
    list_display=['title_en','chapter','position','content_status']
    list_filter=['chapter','content_status']
    search_fields=['title_en','title_ta','id']
    inlines=[BlockInline]
    fields=['id','chapter','slug','title_en','title_ta','position','content_status']
    def get_readonly_fields(self,request,obj=None): return ['id','chapter'] if obj else []

@admin.register(LessonBlock)
class BlockAdmin(admin.ModelAdmin):
    list_display=['title_en','lesson','kind','position','published']
    list_filter=['lesson__chapter','kind','published']
    search_fields=['title_en','title_ta','lesson__title_en']

admin.site.register(Question)

@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display=['user','question','correct','assisted','viewed','created_at']
    readonly_fields=[f.name for f in Attempt._meta.fields]
    def has_add_permission(self,request): return False
    def has_change_permission(self,request,obj=None): return False

