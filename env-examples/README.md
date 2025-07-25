# Environment Example Files

This directory centralises all `.example` environment files. Copy the relevant file to project root or respective service directory and rename to `.env.<environment>` before running locally or deploying.

Structure:

```
env-examples/
  frontend/
    env.development.example
    env.staging.example
    env.production.example
  backend/
    env.development.example
    env.staging.example
    env.production.example
    railway.env.example
    railway-staging.env.example
  env.example              # root combined example
``` 