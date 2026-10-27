// Shared by the public HTML page and its Markdown representation.
export const PRIVACY_UPDATED = 'October 19, 2026'
export const PRIVACY_CONTACT = 'support@moltology.org'
export const PRIVACY_INTRO = 'This Privacy Policy explains how Moltology ("we," "us," or "our") collects, uses, stores, and shares personal information when you use moltology.org, including Google sign-in, member accounts, community features, the Oracle chat, and purchases.'

export const PRIVACY_SECTIONS = [
  {
    id: 'collection',
    title: 'Information we collect',
    paragraphs: [
      'Account and profile information: your email address, name, username, profile picture, optional profile details, and sign-in methods. If you register with a password, we store a password hash rather than your plain-text password. We do not receive your Google password.',
      'Activity and content: progress, completed tasks, preferences, forum posts, messages, Oracle conversations, support requests, and other information you choose to submit. Content you publish in community areas can be visible to other users or the public, depending on the feature.',
      'Technical information: session identifiers, IP address, browser and device information, requests, error logs, page visits, and performance measurements used to operate, secure, and understand the service.',
      'Purchases: order details, payment status, and billing or shipping information needed for your purchase. Payment providers process payment credentials; we do not store full payment card numbers.',
    ],
  },
  {
    id: 'google',
    title: 'Google sign-in and Google user data',
    paragraphs: [
      'Signing in with Google is optional. When you choose it, Moltology requests the openid, email, and profile permissions. Google provides your unique Google account identifier, email address and verification status, name, and profile picture URL when available. These permissions do not give Moltology access to your Gmail messages, Google Drive files, Google Calendar, contacts, or other Google Workspace content.',
      'We use this information to authenticate you, create or connect your Moltology account, display account details, and maintain account security. Your email address may also be used for account and service communications. Google sign-in does not subscribe you to optional marketing emails.',
      'We store your Google account identifier and basic profile information with your Moltology account. Our sign-in system also stores OAuth credentials provided by Google, which may include access tokens, ID tokens, refresh tokens, scopes, and expiry times. These credentials support the sign-in connection and are not published in your profile.',
      'Google user data is handled by the infrastructure providers needed to host and operate our account system, and by email providers when needed to send account communications. Authorized staff may access account information for support, security, or legal requirements. We do not sell Google user data, use it for targeted advertising, or use it to develop, improve, or train generalized or non-personalized AI or machine-learning models.',
      'Moltology\'s use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including its Limited Use requirements. The sharing, security, retention, and deletion provisions below also apply to Google user data.',
    ],
    links: [
      { label: 'Google API Services User Data Policy', href: 'https://developers.google.com/terms/api-services-user-data-policy' },
    ],
  },
  {
    id: 'use',
    title: 'How we use information',
    paragraphs: [
      'We use personal information to provide the features you request, manage accounts and sessions, save progress and preferences, operate community features, process purchases, deliver support and service emails, prevent fraud and abuse, diagnose problems, and meet legal obligations. We use usage and performance measurements to understand and improve the service.',
      'When you use the Oracle, your messages and relevant conversation history are processed by AI service providers to generate replies and conversation titles. Conversations are saved to your account. Avoid including information you do not want processed for this purpose.',
    ],
  },
  {
    id: 'sharing',
    title: 'How we share information',
    paragraphs: [
      'We use service providers for hosting, data storage, email delivery, analytics, security, AI responses, payment processing, and merchandise fulfillment. They receive information needed for their role: for example, a delivery provider receives shipping details, while an AI provider receives the conversation content needed to answer you.',
      'We may disclose information when required by law or to investigate abuse, protect rights and safety, or resolve disputes. If the service is transferred through a merger, acquisition, or sale, information may transfer subject to applicable privacy obligations. Restrictions on Google user data continue to apply.',
      'We do not sell personal information or share it for third-party targeted advertising. Your public profile details and content you choose to publish may be seen by others.',
    ],
  },
  {
    id: 'security',
    title: 'Storage and security',
    paragraphs: [
      'Personal information, including Google account information and sign-in credentials, is stored in our hosted account and application systems. We use HTTPS to protect data in transit, password hashing for password accounts, and authentication and access controls to restrict access to private account data. Access is limited to authorized operations, support, and security needs.',
      'Our service providers may process information in countries other than your own. No storage or transmission method is completely secure. If you believe your account or information has been compromised, contact us using the address below.',
    ],
  },
  {
    id: 'retention',
    title: 'Retention and deletion',
    paragraphs: [
      'We retain account information, including Google account identifiers, profile details, and stored sign-in credentials, while needed to maintain your account and connected sign-in method. We retain content, purchase records, support records, and security logs for the purposes described in this policy and for applicable legal, fraud-prevention, and dispute-resolution requirements.',
      'To request deletion of your Moltology account and associated personal information, including Google user data and stored OAuth credentials, email support@moltology.org from the address associated with your account. You may also request deletion of Google connection data without requesting deletion of the whole account. We may verify ownership before acting on a request.',
      'Following a verified request, we delete information that is no longer needed for those purposes. Information retained for legal or security reasons is limited to that purpose. Backup copies may remain until replaced through the backup lifecycle. Revoking Google access alone does not delete information already stored by Moltology.',
    ],
  },
  {
    id: 'rights',
    title: 'Your choices and Google access controls',
    paragraphs: [
      'You can edit available profile and communication settings in your account. In Settings, the Sign-in methods section lets you disconnect Google when another sign-in method is available. Keep a working sign-in method before disconnecting Google.',
      'You can also revoke Moltology\'s authorization through your Google Account third-party connections page. This prevents continued use of that Google authorization. It does not automatically close your Moltology account, end every existing Moltology session, or erase stored data; use the deletion request process above for that.',
      'Depending on where you live, you may have rights to access, correct, delete, or receive a copy of your personal information, restrict or object to processing, withdraw consent, or complain to a data protection authority. Send requests to support@moltology.org. We respond in accordance with applicable law.',
    ],
    links: [
      { label: 'Manage Google Account third-party connections', href: 'https://myaccount.google.com/connections' },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies and browser storage',
    paragraphs: [
      'We use cookies and browser storage to maintain sign-in sessions, protect authentication flows, and remember preferences. We also collect website usage and performance measurements. You can clear or restrict cookies and local storage through your browser settings; doing so may sign you out or prevent some features from working.',
    ],
  },
  {
    id: 'communications',
    title: 'Email communications',
    paragraphs: [
      'We send account verification, security, purchase, and other service messages when needed. Optional newsletters and updates depend on your subscription choices. You can unsubscribe using the link in an optional email or adjust available account preferences. Unsubscribing from marketing does not stop necessary account or transaction messages. Email delivery and engagement information may be used to operate and assess these communications.',
    ],
  },
  {
    id: 'children',
    title: 'Children\'s privacy',
    paragraphs: [
      'Moltology is not directed to children under 13, or a higher minimum age where applicable law requires it. If you believe a child has provided personal information, contact us so we can investigate and remove information as required.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    paragraphs: [
      'We update the date on this page when this policy changes. We will provide a prominent service notice or email notification of material changes, including changes to how we use Google user data, and obtain additional consent where required before using information for a new purpose.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Moltology',
    paragraphs: [
      'For privacy questions, account and Google data deletion requests, or other data rights requests, contact Moltology at support@moltology.org. Include the email address associated with your account and describe your request. Do not send passwords or OAuth tokens.',
    ],
    links: [{ label: PRIVACY_CONTACT, href: `mailto:${PRIVACY_CONTACT}` }],
  },
]
