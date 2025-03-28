import django.contrib
import django
from django.db import models
from uuid import uuid4
from datetime import datetime
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage

class Base(models.Model):
    """ represents the blueprint for other clases

        Attributes:
            id - a string representing the uuid of the instance
            created_at - date and time the instance was created at
            updated_at - the date and time the instance was modify

    """

    id = models.UUIDField(primary_key=True, default=uuid4, null=False)
    created_at = models.DateTimeField(default=datetime.now)
    updated_at = models.DateTimeField(default=datetime.now)

    class Meta:
        abstract = True

    # pagination
    @classmethod
    def paginate(cls, page_number, page_size=10, order_by=None):
        queryset = cls._default_manager.filter(status='p')
        if order_by:
            queryset = queryset.order_by(order_by)
        paginator = Paginator(queryset, page_size)
        try:
            page = paginator.page(page_number)
        except PageNotAnInteger:
            page = paginator.page(1)
        except EmptyPage:
            page = paginator.page(paginator.num_pages)
        return page
