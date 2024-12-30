chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('reminder-')) {
      chrome.storage.local.get('reminders', (data) => {
        const reminders = data.reminders || [];
        const now = new Date();
        
        // Find and show notifications for due reminders
        reminders.forEach(reminder => {
          const reminderTime = new Date(reminder.datetime);
          if (Math.abs(reminderTime - now) < 60000) { // Within 1 minute
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon.png',
              title: 'Reminder',
              message: reminder.title,
              priority: 2
            });
          }
        });
      });
    }
  });