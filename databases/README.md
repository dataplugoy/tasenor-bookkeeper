# Databases

Default setup creates the following databases.

## Bookkeeper database

For local bookkeeper master database
```
psql postgresql://bookkeeper:Biure80s2rt832@localhost:7202/bookkeeper
```

## Testing databases

There are two other databases used for testing purposes. They are not needed by the application
```
psql postgresql://test:8ydsyTa63298@localhost:7202/test
psql postgresql://demo:oiuewHqw3d@localhost:7202/demo
```

## General Purpose database

In addition, there is an additional database for any kind of additional component/app developement.
```
psql postgresql://tasenor:IU982ehsa09uh0q@localhost:7202/tasenor
```
