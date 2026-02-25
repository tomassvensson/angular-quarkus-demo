import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'en' | 'de' | 'se';

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'se', label: 'Svenska', flag: '🇸🇪' }
];

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.listUsers': 'List Users',
    'nav.publicLists': 'Public Lists',
    'nav.myLists': 'My Lists',
    'nav.analytics': 'Analytics',
    'nav.profile': 'Profile',
    'nav.signIn': 'Sign in',
    'nav.signOut': 'Sign out',

    // Status
    'status.loading': 'Loading user...',
    'status.signedInAs': 'Signed in as',
    'status.roles': 'Roles',
    'status.notSignedIn': 'Not signed in',

    // Home page
    'home.welcome': 'Welcome',
    'home.description': 'This Angular app uses the Quarkus backend for authentication and API access.',
    'home.menuHint': 'Use the top menu to sign in/sign out. Admin users will see the List Users menu item.',
    'home.techTitle': 'Technologies Used',
    'home.tip': 'Tip',
    'home.tipText': 'Once signed in as AdminUser, open List Users to sort, page, and edit group membership.',
    'home.loadingReadme': 'Loading README...',

    // Profile page
    'profile.title': 'My Profile',
    'profile.username': 'Username',
    'profile.email': 'Email',
    'profile.rolesGroups': 'Roles/Groups',
    'profile.deleteAccount': 'Delete Account',
    'profile.deleteConfirm': 'Are you sure you want to delete your account ({email})? This action cannot be undone.',
    'profile.deleted': 'Account deleted.',
    'profile.loading': 'Loading...',
    'profile.changePassword': 'Change Password', // NOSONAR typescript:S2068 - i18n translation key, not a credential
    'profile.currentPassword': 'Current Password', // NOSONAR typescript:S2068
    'profile.newPassword': 'New Password', // NOSONAR typescript:S2068
    'profile.confirmPassword': 'Confirm Password', // NOSONAR typescript:S2068
    'profile.passwordMismatch': 'Passwords do not match.', // NOSONAR typescript:S2068
    'profile.passwordChanged': 'Password changed successfully.', // NOSONAR typescript:S2068
    'profile.passwordChangeFailed': 'Failed to change password: {error}', // NOSONAR typescript:S2068
    'profile.passwordRequired': 'All password fields are required.', // NOSONAR typescript:S2068

    // Profile Picture
    'profilePicture.title': 'Profile Picture',
    'profilePicture.upload': 'Upload Picture',
    'profilePicture.remove': 'Remove Picture',
    'profilePicture.removeConfirm': 'Are you sure you want to remove your profile picture?',
    'profilePicture.uploaded': 'Profile picture uploaded successfully.',
    'profilePicture.removed': 'Profile picture removed.',
    'profilePicture.uploadFailed': 'Failed to upload profile picture.',
    'profilePicture.tooLarge': 'File is too large. Maximum size is 5 MB.',
    'profilePicture.hint': 'Upload a PNG, JPEG, GIF, or WebP image (max 5 MB). Falls back to Gravatar.',

    // MFA
    'mfa.title': 'Multi-Factor Authentication',
    'mfa.trustedDevices': 'Trusted Devices',
    'mfa.noDevices': 'No trusted devices found.',
    'mfa.removeDevice': 'Remove',
    'mfa.removeDeviceConfirm': 'Remove device "{name}"?',
    'mfa.deviceRemoved': 'Device removed successfully.',
    'mfa.setupTotp': 'Setup Authenticator App',
    'mfa.totpInstructions': 'Scan the QR code below with your authenticator app, or enter the secret key manually.',
    'mfa.secretKey': 'Secret Key',
    'mfa.enterCode': 'Enter verification code',
    'mfa.verify': 'Verify',
    'mfa.verified': 'Authenticator verified successfully!',
    'mfa.verifyFailed': 'Verification failed: {error}',
    'mfa.preferences': 'MFA Preferences',
    'mfa.enableTotp': 'Enable Authenticator App (TOTP)',
    'mfa.enableSms': 'Enable SMS',
    'mfa.preferredMethod': 'Preferred Method',
    'mfa.savePreferences': 'Save Preferences',
    'mfa.preferencesSaved': 'MFA preferences updated.',
    'mfa.preferencesFailed': 'Failed to update MFA preferences: {error}',
    'mfa.none': 'None',
    'mfa.totp': 'TOTP',
    'mfa.sms': 'SMS',

    // My Lists
    'myLists.title': 'My Lists',
    'myLists.newListPlaceholder': 'New List Name',
    'myLists.createList': 'Create List',
    'myLists.created': 'Created',
    'myLists.published': 'Published',
    'myLists.links': 'Links',
    'myLists.publish': 'Publish',
    'myLists.unpublish': 'Unpublish',
    'myLists.delete': 'Delete',
    'myLists.noLists': 'No lists found. Create one above.',
    'myLists.viewPublic': 'View Public Lists',
    'myLists.confirmPublish': 'Are you sure you want to publish the list "{name}"?',
    'myLists.confirmUnpublish': 'Are you sure you want to unpublish the list "{name}"?',
    'myLists.confirmDelete': 'Are you sure you want to delete the list "{name}"?',

    // Public Lists
    'publicLists.title': 'Public Lists',
    'publicLists.owner': 'Owner',
    'publicLists.noLists': 'No public lists found.',
    'publicLists.backToMyLists': 'Back to My Lists',
    'publicLists.previous': 'Previous',
    'publicLists.next': 'Next',
    'publicLists.page': 'Page',
    'publicLists.of': 'of',
    'publicLists.totalLists': 'total lists',

    // Vote Analytics
    'analytics.title': 'Vote Analytics',
    'analytics.subtitle': 'Rating distribution and trends for published lists.',
    'analytics.loading': 'Loading analytics...',
    'analytics.noData': 'No published lists found.',
    'analytics.totalVotes': 'Total Votes',
    'analytics.overallAverage': 'Overall Average',
    'analytics.ratedLists': 'Rated Lists',
    'analytics.votes': 'Votes',
    'analytics.avg': 'Avg',
    'analytics.backToPublicLists': 'Back to Public Lists',

    // List Detail
    'listDetail.editName': 'Edit Name',
    'listDetail.save': 'Save',
    'listDetail.cancel': 'Cancel',
    'listDetail.addNewLink': 'Add New Link',
    'listDetail.urlPlaceholder': 'URL (https://...)',
    'listDetail.titlePlaceholder': 'Title',
    'listDetail.addLink': 'Add Link',
    'listDetail.remove': 'Remove',
    'listDetail.noLinks': 'No links in this list yet.',
    'listDetail.owner': 'Owner',
    'listDetail.created': 'Created',
    'listDetail.lastEdited': 'Last Edited',
    'listDetail.count': 'Count',
    'listDetail.loading': 'Loading...',
    'listDetail.myLists': 'My Lists',

    // Comments
    'comments.title': 'Comments',
    'comments.writePlaceholder': 'Write your comment...',
    'comments.postComment': 'Post Comment',
    'comments.replyPlaceholder': 'Write a reply...',
    'comments.reply': 'Reply',
    'comments.cancel': 'Cancel',
    'comments.noComments': 'No comments yet. Be the first to comment!',
    'comments.edited': '(edited)',
    'comments.deleteConfirm': 'Are you sure you want to delete this comment?',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.unread': 'unread',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.commentedOn': 'commented on',
    'notifications.repliedOn': 'replied on',
    'notifications.aList': 'a list',
    'notifications.aLink': 'a link',
    'notifications.noNotifications': 'No notifications yet.',

    // Admin Users
    'admin.users': 'Users',
    'admin.description': 'Admin view with pagination and sortable columns.',
    'admin.loadingUsers': 'Loading users...',
    'admin.username': 'Username',
    'admin.email': 'Email',
    'admin.emailVerified': 'Email verified',
    'admin.confirmationStatus': 'Confirmation status',
    'admin.status': 'Status',
    'admin.enabled': 'Enabled',
    'admin.created': 'Created',
    'admin.lastUpdated': 'Last updated',
    'admin.mfaSetting': 'MFA setting',
    'admin.groupMembership': 'Group membership',
    'admin.action': 'Action',
    'admin.previous': 'Previous',
    'admin.next': 'Next',
    'admin.page': 'Page',
    'admin.totalUsers': 'Total users',
    'admin.deleteConfirm': 'Are you sure you want to delete {username} ({email})?',
    'admin.yes': 'Yes',
    'admin.no': 'No',
    'admin.none': 'None',

    // User Edit
    'userEdit.title': 'Edit User',
    'userEdit.saved': 'Saved successfully.',
    'userEdit.save': 'Save',
    'userEdit.backToUsers': 'Back to Users',

    // Star Rating
    'rating.vote': 'vote',
    'rating.votes': 'votes',

    // Theme
    'theme.light': 'Light mode',
    'theme.system': 'System default',
    'theme.dark': 'Dark mode',

    // Validation
    'validation.invalidUrl': 'Please enter a valid URL (e.g. https://example.com)',
    'validation.invalidDomain': 'Please enter a valid URL with a domain (e.g. https://example.com)',
    'validation.protocolNotAllowed': 'Only http, https, and ftp URLs are allowed.',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.delete': 'Delete',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.couldNotLoad': 'Could not load data',
    'common.couldNotSave': 'Could not save data',

    // Accessibility
    'a11y.writeComment': 'Write a comment',
    'a11y.editComment': 'Edit your comment',
    'a11y.editReply': 'Edit your reply',
    'a11y.replyTo': 'Reply to comment by {user}',
    'a11y.rateStar': 'Rate {count} star',
    'a11y.rateStars': 'Rate {count} stars',
    'a11y.ratingDescription': 'Rating: {avg} out of 5 stars from {count} {votes}',
    'a11y.notifications': 'Notifications',
    'a11y.unreadNotifications': '{count} unread notifications',
    'a11y.dismissNotification': 'Dismiss notification',
    'a11y.readStatus': 'Read',
    'a11y.unreadStatus': 'Unread',

    // Error messages
    'error.couldNotDeleteUser': 'Could not delete user',
    'error.couldNotLoadUsers': 'Could not load users',
    'error.couldNotSaveUser': 'Could not save user',
    'error.couldNotLoadUser': 'Could not load user',
    'error.couldNotDeleteAccount': 'Could not delete account',

    // List Detail extra
    'listDetail.added': 'Added:',
  },

  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.listUsers': 'Benutzer',
    'nav.publicLists': 'Öffentliche Listen',
    'nav.myLists': 'Meine Listen',
    'nav.analytics': 'Analyse',
    'nav.profile': 'Profil',
    'nav.signIn': 'Anmelden',
    'nav.signOut': 'Abmelden',

    // Status
    'status.loading': 'Benutzer wird geladen...',
    'status.signedInAs': 'Angemeldet als',
    'status.roles': 'Rollen',
    'status.notSignedIn': 'Nicht angemeldet',

    // Home page
    'home.welcome': 'Willkommen',
    'home.description': 'Diese Angular-App nutzt das Quarkus-Backend für Authentifizierung und API-Zugriff.',
    'home.menuHint': 'Verwenden Sie das Menü oben zum An-/Abmelden. Administratoren sehen den Menüpunkt Benutzer.',
    'home.techTitle': 'Verwendete Technologien',
    'home.tip': 'Tipp',
    'home.tipText': 'Nach der Anmeldung als AdminUser können Sie unter Benutzer sortieren, blättern und Gruppen bearbeiten.',
    'home.loadingReadme': 'README wird geladen...',

    // Profile page
    'profile.title': 'Mein Profil',
    'profile.username': 'Benutzername',
    'profile.email': 'E-Mail',
    'profile.rolesGroups': 'Rollen/Gruppen',
    'profile.deleteAccount': 'Konto löschen',
    'profile.deleteConfirm': 'Sind Sie sicher, dass Sie Ihr Konto ({email}) löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
    'profile.deleted': 'Konto gelöscht.',
    'profile.loading': 'Wird geladen...',
    'profile.changePassword': 'Passwort ändern', // NOSONAR typescript:S2068
    'profile.currentPassword': 'Aktuelles Passwort', // NOSONAR typescript:S2068
    'profile.newPassword': 'Neues Passwort', // NOSONAR typescript:S2068
    'profile.confirmPassword': 'Passwort bestätigen', // NOSONAR typescript:S2068
    'profile.passwordMismatch': 'Passwörter stimmen nicht überein.', // NOSONAR typescript:S2068
    'profile.passwordChanged': 'Passwort erfolgreich geändert.', // NOSONAR typescript:S2068
    'profile.passwordChangeFailed': 'Passwort konnte nicht geändert werden: {error}', // NOSONAR typescript:S2068
    'profile.passwordRequired': 'Alle Passwortfelder sind erforderlich.', // NOSONAR typescript:S2068

    // Profile Picture
    'profilePicture.title': 'Profilbild',
    'profilePicture.upload': 'Bild hochladen',
    'profilePicture.remove': 'Bild entfernen',
    'profilePicture.removeConfirm': 'Sind Sie sicher, dass Sie Ihr Profilbild entfernen möchten?',
    'profilePicture.uploaded': 'Profilbild erfolgreich hochgeladen.',
    'profilePicture.removed': 'Profilbild entfernt.',
    'profilePicture.uploadFailed': 'Profilbild konnte nicht hochgeladen werden.',
    'profilePicture.tooLarge': 'Die Datei ist zu groß. Maximale Größe ist 5 MB.',
    'profilePicture.hint': 'Laden Sie ein PNG-, JPEG-, GIF- oder WebP-Bild hoch (max. 5 MB). Fällt auf Gravatar zurück.',

    // MFA
    'mfa.title': 'Multi-Faktor-Authentifizierung',
    'mfa.trustedDevices': 'Vertrauenswürdige Geräte',
    'mfa.noDevices': 'Keine vertrauenswürdigen Geräte gefunden.',
    'mfa.removeDevice': 'Entfernen',
    'mfa.removeDeviceConfirm': 'Gerät "{name}" entfernen?',
    'mfa.deviceRemoved': 'Gerät erfolgreich entfernt.',
    'mfa.setupTotp': 'Authentifizierungs-App einrichten',
    'mfa.totpInstructions': 'Scannen Sie den QR-Code mit Ihrer Authentifizierungs-App oder geben Sie den Geheimschlüssel manuell ein.',
    'mfa.secretKey': 'Geheimschlüssel',
    'mfa.enterCode': 'Bestätigungscode eingeben',
    'mfa.verify': 'Bestätigen',
    'mfa.verified': 'Authentifizierung erfolgreich bestätigt!',
    'mfa.verifyFailed': 'Bestätigung fehlgeschlagen: {error}',
    'mfa.preferences': 'MFA-Einstellungen',
    'mfa.enableTotp': 'Authentifizierungs-App (TOTP) aktivieren',
    'mfa.enableSms': 'SMS aktivieren',
    'mfa.preferredMethod': 'Bevorzugte Methode',
    'mfa.savePreferences': 'Einstellungen speichern',
    'mfa.preferencesSaved': 'MFA-Einstellungen aktualisiert.',
    'mfa.preferencesFailed': 'MFA-Einstellungen konnten nicht aktualisiert werden: {error}',
    'mfa.none': 'Keine',
    'mfa.totp': 'TOTP',
    'mfa.sms': 'SMS',

    // My Lists
    'myLists.title': 'Meine Listen',
    'myLists.newListPlaceholder': 'Neuer Listenname',
    'myLists.createList': 'Liste erstellen',
    'myLists.created': 'Erstellt',
    'myLists.published': 'Veröffentlicht',
    'myLists.links': 'Links',
    'myLists.publish': 'Veröffentlichen',
    'myLists.unpublish': 'Zurückziehen',
    'myLists.delete': 'Löschen',
    'myLists.noLists': 'Keine Listen gefunden. Erstellen Sie eine oben.',
    'myLists.viewPublic': 'Öffentliche Listen anzeigen',
    'myLists.confirmPublish': 'Möchten Sie die Liste „{name}" wirklich veröffentlichen?',
    'myLists.confirmUnpublish': 'Möchten Sie die Liste „{name}" wirklich zurückziehen?',
    'myLists.confirmDelete': 'Möchten Sie die Liste „{name}" wirklich löschen?',

    // Public Lists
    'publicLists.title': 'Öffentliche Listen',
    'publicLists.owner': 'Eigentümer',
    'publicLists.noLists': 'Keine öffentlichen Listen gefunden.',
    'publicLists.backToMyLists': 'Zurück zu meinen Listen',
    'publicLists.previous': 'Zurück',
    'publicLists.next': 'Weiter',
    'publicLists.page': 'Seite',
    'publicLists.of': 'von',
    'publicLists.totalLists': 'Listen gesamt',

    // Vote Analytics
    'analytics.title': 'Abstimmungsanalyse',
    'analytics.subtitle': 'Bewertungsverteilung und Trends für veröffentlichte Listen.',
    'analytics.loading': 'Analyse wird geladen...',
    'analytics.noData': 'Keine veröffentlichten Listen gefunden.',
    'analytics.totalVotes': 'Gesamtstimmen',
    'analytics.overallAverage': 'Gesamtdurchschnitt',
    'analytics.ratedLists': 'Bewertete Listen',
    'analytics.votes': 'Stimmen',
    'analytics.avg': 'Durchschnitt',
    'analytics.backToPublicLists': 'Zurück zu öffentlichen Listen',

    // List Detail
    'listDetail.editName': 'Name bearbeiten',
    'listDetail.save': 'Speichern',
    'listDetail.cancel': 'Abbrechen',
    'listDetail.addNewLink': 'Neuen Link hinzufügen',
    'listDetail.urlPlaceholder': 'URL (https://...)',
    'listDetail.titlePlaceholder': 'Titel',
    'listDetail.addLink': 'Link hinzufügen',
    'listDetail.remove': 'Entfernen',
    'listDetail.noLinks': 'Noch keine Links in dieser Liste.',
    'listDetail.owner': 'Eigentümer',
    'listDetail.created': 'Erstellt',
    'listDetail.lastEdited': 'Zuletzt bearbeitet',
    'listDetail.count': 'Anzahl',
    'listDetail.loading': 'Wird geladen...',
    'listDetail.myLists': 'Meine Listen',

    // Comments
    'comments.title': 'Kommentare',
    'comments.writePlaceholder': 'Schreiben Sie einen Kommentar...',
    'comments.postComment': 'Kommentar abschicken',
    'comments.replyPlaceholder': 'Antwort schreiben...',
    'comments.reply': 'Antworten',
    'comments.cancel': 'Abbrechen',
    'comments.noComments': 'Noch keine Kommentare. Schreiben Sie den ersten!',
    'comments.edited': '(bearbeitet)',
    'comments.deleteConfirm': 'Sind Sie sicher, dass Sie diesen Kommentar löschen möchten?',

    // Notifications
    'notifications.title': 'Benachrichtigungen',
    'notifications.unread': 'ungelesen',
    'notifications.markAllRead': 'Alle als gelesen markieren',
    'notifications.commentedOn': 'hat kommentiert',
    'notifications.repliedOn': 'hat geantwortet auf',
    'notifications.aList': 'eine Liste',
    'notifications.aLink': 'einen Link',
    'notifications.noNotifications': 'Noch keine Benachrichtigungen.',

    // Admin Users
    'admin.users': 'Benutzer',
    'admin.description': 'Administratoransicht mit Paginierung und sortierbaren Spalten.',
    'admin.loadingUsers': 'Benutzer werden geladen...',
    'admin.username': 'Benutzername',
    'admin.email': 'E-Mail',
    'admin.emailVerified': 'E-Mail bestätigt',
    'admin.confirmationStatus': 'Bestätigungsstatus',
    'admin.status': 'Status',
    'admin.enabled': 'Aktiviert',
    'admin.created': 'Erstellt',
    'admin.lastUpdated': 'Zuletzt aktualisiert',
    'admin.mfaSetting': 'MFA-Einstellung',
    'admin.groupMembership': 'Gruppenmitgliedschaft',
    'admin.action': 'Aktion',
    'admin.previous': 'Zurück',
    'admin.next': 'Weiter',
    'admin.page': 'Seite',
    'admin.totalUsers': 'Benutzer gesamt',
    'admin.deleteConfirm': 'Möchten Sie {username} ({email}) wirklich löschen?',
    'admin.yes': 'Ja',
    'admin.no': 'Nein',
    'admin.none': 'Keine',

    // User Edit
    'userEdit.title': 'Benutzer bearbeiten',
    'userEdit.saved': 'Erfolgreich gespeichert.',
    'userEdit.save': 'Speichern',
    'userEdit.backToUsers': 'Zurück zu Benutzern',

    // Star Rating
    'rating.vote': 'Stimme',
    'rating.votes': 'Stimmen',

    // Theme
    'theme.light': 'Hell',
    'theme.system': 'System',
    'theme.dark': 'Dunkel',

    // Validation
    'validation.invalidUrl': 'Bitte geben Sie eine gültige URL ein (z.B. https://beispiel.de)',
    'validation.invalidDomain': 'Bitte geben Sie eine gültige URL mit einer Domain ein (z.B. https://beispiel.de)',
    'validation.protocolNotAllowed': 'Nur http-, https- und ftp-URLs sind erlaubt.',

    // Common
    'common.loading': 'Wird geladen...',
    'common.error': 'Fehler',
    'common.delete': 'Löschen',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.couldNotLoad': 'Daten konnten nicht geladen werden',
    'common.couldNotSave': 'Daten konnten nicht gespeichert werden',

    // Accessibility
    'a11y.writeComment': 'Kommentar schreiben',
    'a11y.editComment': 'Kommentar bearbeiten',
    'a11y.editReply': 'Antwort bearbeiten',
    'a11y.replyTo': 'Auf Kommentar von {user} antworten',
    'a11y.rateStar': '{count} Stern bewerten',
    'a11y.rateStars': '{count} Sterne bewerten',
    'a11y.ratingDescription': 'Bewertung: {avg} von 5 Sternen aus {count} {votes}',
    'a11y.notifications': 'Benachrichtigungen',
    'a11y.unreadNotifications': '{count} ungelesene Benachrichtigungen',
    'a11y.dismissNotification': 'Benachrichtigung schließen',
    'a11y.readStatus': 'Gelesen',
    'a11y.unreadStatus': 'Ungelesen',

    // Error messages
    'error.couldNotDeleteUser': 'Benutzer konnte nicht gelöscht werden',
    'error.couldNotLoadUsers': 'Benutzer konnten nicht geladen werden',
    'error.couldNotSaveUser': 'Benutzer konnte nicht gespeichert werden',
    'error.couldNotLoadUser': 'Benutzer konnte nicht geladen werden',
    'error.couldNotDeleteAccount': 'Konto konnte nicht gelöscht werden',

    // List Detail extra
    'listDetail.added': 'Hinzugefügt:',
  },

  se: {
    // Navigation
    'nav.home': 'Hem',
    'nav.listUsers': 'Användare',
    'nav.publicLists': 'Publika listor',
    'nav.myLists': 'Mina listor',
    'nav.analytics': 'Analys',
    'nav.profile': 'Profil',
    'nav.signIn': 'Logga in',
    'nav.signOut': 'Logga ut',

    // Status
    'status.loading': 'Laddar användare...',
    'status.signedInAs': 'Inloggad som',
    'status.roles': 'Roller',
    'status.notSignedIn': 'Inte inloggad',

    // Home page
    'home.welcome': 'Välkommen',
    'home.description': 'Denna Angular-app använder Quarkus-backend för autentisering och API-åtkomst.',
    'home.menuHint': 'Använd menyn ovan för att logga in/ut. Administratörer ser menyalternativet Användare.',
    'home.techTitle': 'Använda teknologier',
    'home.tip': 'Tips',
    'home.tipText': 'Efter inloggning som AdminUser, öppna Användare för att sortera, bläddra och redigera gruppmedlemskap.',
    'home.loadingReadme': 'Laddar README...',

    // Profile page
    'profile.title': 'Min profil',
    'profile.username': 'Användarnamn',
    'profile.email': 'E-post',
    'profile.rolesGroups': 'Roller/Grupper',
    'profile.deleteAccount': 'Radera konto',
    'profile.deleteConfirm': 'Är du säker på att du vill radera ditt konto ({email})? Denna åtgärd kan inte ångras.',
    'profile.deleted': 'Konto raderat.',
    'profile.loading': 'Laddar...',
    'profile.changePassword': 'Ändra lösenord', // NOSONAR typescript:S2068
    'profile.currentPassword': 'Nuvarande lösenord', // NOSONAR typescript:S2068
    'profile.newPassword': 'Nytt lösenord', // NOSONAR typescript:S2068
    'profile.confirmPassword': 'Bekräfta lösenord', // NOSONAR typescript:S2068
    'profile.passwordMismatch': 'Lösenorden matchar inte.', // NOSONAR typescript:S2068
    'profile.passwordChanged': 'Lösenordet har ändrats.', // NOSONAR typescript:S2068
    'profile.passwordChangeFailed': 'Kunde inte ändra lösenord: {error}', // NOSONAR typescript:S2068
    'profile.passwordRequired': 'Alla lösenordsfält krävs.', // NOSONAR typescript:S2068

    // Profile Picture
    'profilePicture.title': 'Profilbild',
    'profilePicture.upload': 'Ladda upp bild',
    'profilePicture.remove': 'Ta bort bild',
    'profilePicture.removeConfirm': 'Är du säker på att du vill ta bort din profilbild?',
    'profilePicture.uploaded': 'Profilbild uppladdad.',
    'profilePicture.removed': 'Profilbild borttagen.',
    'profilePicture.uploadFailed': 'Kunde inte ladda upp profilbild.',
    'profilePicture.tooLarge': 'Filen är för stor. Maximal storlek är 5 MB.',
    'profilePicture.hint': 'Ladda upp en PNG-, JPEG-, GIF- eller WebP-bild (max 5 MB). Faller tillbaka till Gravatar.',

    // MFA
    'mfa.title': 'Flerfaktorsautentisering',
    'mfa.trustedDevices': 'Betrodda enheter',
    'mfa.noDevices': 'Inga betrodda enheter hittades.',
    'mfa.removeDevice': 'Ta bort',
    'mfa.removeDeviceConfirm': 'Ta bort enhet "{name}"?',
    'mfa.deviceRemoved': 'Enhet borttagen.',
    'mfa.setupTotp': 'Konfigurera autentiseringsapp',
    'mfa.totpInstructions': 'Skanna QR-koden med din autentiseringsapp eller ange den hemliga nyckeln manuellt.',
    'mfa.secretKey': 'Hemlig nyckel',
    'mfa.enterCode': 'Ange verifieringskod',
    'mfa.verify': 'Verifiera',
    'mfa.verified': 'Autentisering verifierad!',
    'mfa.verifyFailed': 'Verifiering misslyckades: {error}',
    'mfa.preferences': 'MFA-inställningar',
    'mfa.enableTotp': 'Aktivera autentiseringsapp (TOTP)',
    'mfa.enableSms': 'Aktivera SMS',
    'mfa.preferredMethod': 'Föredragen metod',
    'mfa.savePreferences': 'Spara inställningar',
    'mfa.preferencesSaved': 'MFA-inställningar uppdaterade.',
    'mfa.preferencesFailed': 'Kunde inte uppdatera MFA-inställningar: {error}',
    'mfa.none': 'Ingen',
    'mfa.totp': 'TOTP',
    'mfa.sms': 'SMS',

    // My Lists
    'myLists.title': 'Mina listor',
    'myLists.newListPlaceholder': 'Nytt listnamn',
    'myLists.createList': 'Skapa lista',
    'myLists.created': 'Skapad',
    'myLists.published': 'Publicerad',
    'myLists.links': 'Länkar',
    'myLists.publish': 'Publicera',
    'myLists.unpublish': 'Avpublicera',
    'myLists.delete': 'Radera',
    'myLists.noLists': 'Inga listor hittades. Skapa en ovan.',
    'myLists.viewPublic': 'Visa publika listor',
    'myLists.confirmPublish': 'Är du säker på att du vill publicera listan "{name}"?',
    'myLists.confirmUnpublish': 'Är du säker på att du vill avpublicera listan "{name}"?',
    'myLists.confirmDelete': 'Är du säker på att du vill radera listan "{name}"?',

    // Public Lists
    'publicLists.title': 'Publika listor',
    'publicLists.owner': 'Ägare',
    'publicLists.noLists': 'Inga publika listor hittades.',
    'publicLists.backToMyLists': 'Tillbaka till mina listor',
    'publicLists.previous': 'Föregående',
    'publicLists.next': 'Nästa',
    'publicLists.page': 'Sida',
    'publicLists.of': 'av',
    'publicLists.totalLists': 'listor totalt',

    // Vote Analytics
    'analytics.title': 'Röstanalys',
    'analytics.subtitle': 'Betygsfördelning och trender för publicerade listor.',
    'analytics.loading': 'Laddar analys...',
    'analytics.noData': 'Inga publicerade listor hittade.',
    'analytics.totalVotes': 'Totala röster',
    'analytics.overallAverage': 'Totalt genomsnitt',
    'analytics.ratedLists': 'Betygsatta listor',
    'analytics.votes': 'Röster',
    'analytics.avg': 'Genomsnitt',
    'analytics.backToPublicLists': 'Tillbaka till publika listor',

    // List Detail
    'listDetail.editName': 'Ändra namn',
    'listDetail.save': 'Spara',
    'listDetail.cancel': 'Avbryt',
    'listDetail.addNewLink': 'Lägg till ny länk',
    'listDetail.urlPlaceholder': 'URL (https://...)',
    'listDetail.titlePlaceholder': 'Titel',
    'listDetail.addLink': 'Lägg till länk',
    'listDetail.remove': 'Ta bort',
    'listDetail.noLinks': 'Inga länkar i denna lista ännu.',
    'listDetail.owner': 'Ägare',
    'listDetail.created': 'Skapad',
    'listDetail.lastEdited': 'Senast redigerad',
    'listDetail.count': 'Antal',
    'listDetail.loading': 'Laddar...',
    'listDetail.myLists': 'Mina listor',

    // Comments
    'comments.title': 'Kommentarer',
    'comments.writePlaceholder': 'Skriv en kommentar...',
    'comments.postComment': 'Posta kommentar',
    'comments.replyPlaceholder': 'Skriv ett svar...',
    'comments.reply': 'Svara',
    'comments.cancel': 'Avbryt',
    'comments.noComments': 'Inga kommentarer ännu. Bli den första att kommentera!',
    'comments.edited': '(redigerad)',
    'comments.deleteConfirm': 'Är du säker på att du vill radera denna kommentar?',

    // Notifications
    'notifications.title': 'Notiser',
    'notifications.unread': 'olästa',
    'notifications.markAllRead': 'Markera alla som lästa',
    'notifications.commentedOn': 'kommenterade',
    'notifications.repliedOn': 'svarade på',
    'notifications.aList': 'en lista',
    'notifications.aLink': 'en länk',
    'notifications.noNotifications': 'Inga notiser ännu.',

    // Admin Users
    'admin.users': 'Användare',
    'admin.description': 'Administratörsvy med paginering och sorterbara kolumner.',
    'admin.loadingUsers': 'Laddar användare...',
    'admin.username': 'Användarnamn',
    'admin.email': 'E-post',
    'admin.emailVerified': 'E-post verifierad',
    'admin.confirmationStatus': 'Bekräftelsestatus',
    'admin.status': 'Status',
    'admin.enabled': 'Aktiverad',
    'admin.created': 'Skapad',
    'admin.lastUpdated': 'Senast uppdaterad',
    'admin.mfaSetting': 'MFA-inställning',
    'admin.groupMembership': 'Gruppmedlemskap',
    'admin.action': 'Åtgärd',
    'admin.previous': 'Föregående',
    'admin.next': 'Nästa',
    'admin.page': 'Sida',
    'admin.totalUsers': 'Totalt antal användare',
    'admin.deleteConfirm': 'Är du säker på att du vill radera {username} ({email})?',
    'admin.yes': 'Ja',
    'admin.no': 'Nej',
    'admin.none': 'Inga',

    // User Edit
    'userEdit.title': 'Redigera användare',
    'userEdit.saved': 'Sparad.',
    'userEdit.save': 'Spara',
    'userEdit.backToUsers': 'Tillbaka till användare',

    // Star Rating
    'rating.vote': 'röst',
    'rating.votes': 'röster',

    // Theme
    'theme.light': 'Ljust',
    'theme.system': 'System',
    'theme.dark': 'Mörkt',

    // Validation
    'validation.invalidUrl': 'Ange en giltig URL (t.ex. https://example.com)',
    'validation.invalidDomain': 'Ange en giltig URL med en domän (t.ex. https://example.com)',
    'validation.protocolNotAllowed': 'Bara http-, https- och ftp-URL:er är tillåtna.',

    // Common
    'common.loading': 'Laddar...',
    'common.error': 'Fel',
    'common.delete': 'Radera',
    'common.yes': 'Ja',
    'common.no': 'Nej',
    'common.couldNotLoad': 'Kunde inte ladda data',
    'common.couldNotSave': 'Kunde inte spara data',

    // Accessibility
    'a11y.writeComment': 'Skriv en kommentar',
    'a11y.editComment': 'Redigera din kommentar',
    'a11y.editReply': 'Redigera ditt svar',
    'a11y.replyTo': 'Svara på kommentar av {user}',
    'a11y.rateStar': 'Betygsätt {count} stjärna',
    'a11y.rateStars': 'Betygsätt {count} stjärnor',
    'a11y.ratingDescription': 'Betyg: {avg} av 5 stjärnor från {count} {votes}',
    'a11y.notifications': 'Notiser',
    'a11y.unreadNotifications': '{count} olästa notiser',
    'a11y.dismissNotification': 'Stäng notis',
    'a11y.readStatus': 'Läst',
    'a11y.unreadStatus': 'Oläst',

    // Error messages
    'error.couldNotDeleteUser': 'Kunde inte radera användare',
    'error.couldNotLoadUsers': 'Kunde inte ladda användare',
    'error.couldNotSaveUser': 'Kunde inte spara användare',
    'error.couldNotLoadUser': 'Kunde inte ladda användare',
    'error.couldNotDeleteAccount': 'Kunde inte radera konto',

    // List Detail extra
    'listDetail.added': 'Tillagd:',
  }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'language-preference';

  readonly language = signal<Language>('en');
  readonly currentLanguage = computed(() => LANGUAGES.find(l => l.code === this.language()) ?? LANGUAGES[0]);

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const stored = globalThis.localStorage.getItem(this.STORAGE_KEY) as Language | null;
    if (stored && ['en', 'de', 'se'].includes(stored)) {
      this.language.set(stored);
      return;
    }

    // Detect browser language
    const browserLang = globalThis.navigator.language?.toLowerCase() ?? '';
    if (browserLang.startsWith('de')) {
      this.language.set('de');
    } else if (browserLang.startsWith('sv') || browserLang.startsWith('se')) {
      this.language.set('se');
    }
  }

  setLanguage(lang: Language): void {
    this.language.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      globalThis.localStorage.setItem(this.STORAGE_KEY, lang);
    }
  }

  /** Translate a key with optional interpolation params */
  t(key: string, params?: Record<string, string>): string {
    const lang = this.language();
    let value = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replaceAll(`{${k}}`, v);
      }
    }
    return value;
  }
}
