from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.billing.models import Subscription


@receiver(post_save, sender=User)
def create_subscription(sender, instance, created, **kwargs):
    if created:
        Subscription.objects.get_or_create(owner=instance)
