# Databases

Default setup creates the following databases.

## Bookkeeper database

For local bookkeeper master database
```sh
psql postgresql://bookkeeper:Biure80s2rt832@localhost:7202/bookkeeper
```

There is some sample data which can be loaded with
```sh
pnpm run load
```
which creates system admin `root@localhost` with password `Ayfiewchg872rt5sq2e4` and normal
user `user@localhost` with password `Ayfiewchg872rt5sq2e4`.


## Testing databases

There are two other databases used for testing purposes. They are not needed by the application
```sh
psql postgresql://test:8ydsyTa63298@localhost:7202/test
psql postgresql://demo:oiuewHqw3d@localhost:7202/demo
```

## General Purpose database

In addition, there is an additional database for any kind of additional component/app developement.
```sh
psql postgresql://tasenor:IU982ehsa09uh0q@localhost:7202/tasenor
```
