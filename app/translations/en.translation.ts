export default {
  nav: {
    menu: {
      home: 'Home',
      search: 'Search',
    },
    account: {
      register: 'Join for free',
      login: 'Log in',
    },
  },
  form: {
    login: {
      user: {
        'already-exists': 'A user with this email address already exists!',
        'is-not-verified': 'Please verify your email address in order to log in!',
        'does-not-exist-or-password-is-wrong': 'The email address or password is incorrect!',
      },
      'internal-error': 'Something went wrong! Please try again later.',
    },
    register: {
      success: 'We\'ve sent you an email to verify your account.',
      invalid: {
        name: 'The name is incorrect!',
        password: 'The password is not strong enough!',
      },
      user: {
        'already-exists': 'A user with this email address already exists!',
      },
    },
  },
}
