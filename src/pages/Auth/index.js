import Login from "./components/login"

const LoginConfig = {
  type: "ams-manager",
  props: {
    showHeaders: false,
    className: 'h-full',
    params: {
      action: '/auth/login'
    },
  },
  wrappers: [
    "ams-redux",
    // "ams-router",
  ],
  children: [
    { type: Login,
      wrappers: ["ams-login"],
      props: {amsAction: '/auth/login'}
    },
    { type: "ams-reset-password" },
  ]
}

const LogoutConfig = {
  type: "ams-manager",
  props: {
    showHeaders: false,
    className: 'h-full',
    params: {
      action: '/auth/logout'
    },
  },
  wrappers: [
    "ams-redux",
    // "ams-router",
  ],
  children: [
    { type: "ams-logout",
      props: {amsAction: '/auth/logout'}
    // @props.redirectTo
    // Optional prop. Defaults to "/".
    // Redirects user to URL after logging out.
    // props: { redirectTo: "/" }
    }
  ]
}

const AuthSystemConfig = [{
  path: "/auth/login",
  mainNav: false,
  sideNav: {
    size: 'none'
  },
  component: LoginConfig
},
  {
    path: "/auth/logout",
    mainNav: false,
    sideNav: {
      size: 'none'
    },
    component: LogoutConfig
  }
  ]
export default AuthSystemConfig