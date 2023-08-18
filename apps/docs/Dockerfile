FROM node:18-alpine

# Install basics.
RUN apk update
RUN apk upgrade
RUN apk add thttpd lighttpd

# Create a non-root user to own the files and run our server
RUN adduser -D static
WORKDIR /home/static
USER static

# Set up Doccer.
COPY build /home/static/build

# Launch httpd.
USER root
COPY lighttpd.conf /home/static
RUN mkdir -p /var/cache/lighttpd/compress/
RUN mkdir -p /var/log/lighttpd/
RUN chown -R static.static /var/log/lighttpd/ /var/cache/lighttpd/compress/

USER static
CMD ["/usr/sbin/lighttpd", "-D", "-f", "./lighttpd.conf"]
