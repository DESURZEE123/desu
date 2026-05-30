export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/home/index',
    'pages/record-new/index',
    'pages/record-edit/index',
    'pages/month-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f8f9fb',
    navigationBarTitleText: '工作记录',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom'
  }
})
