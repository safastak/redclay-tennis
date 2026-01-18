# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Red Clay Tennis" [level=2] [ref=e5]
      - paragraph [ref=e6]: Sign in to your account
    - generic [ref=e7]:
      - paragraph [ref=e9]: Invalid email or password
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Email address
          - textbox "Email address" [ref=e13]: admin@redclay.com
        - generic [ref=e14]:
          - generic [ref=e15]: Password
          - textbox "Password" [ref=e16]: admin123
      - button "Sign in" [ref=e18]
      - link "Don't have an account? Sign up" [ref=e20] [cursor=pointer]:
        - /url: /signup
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
```