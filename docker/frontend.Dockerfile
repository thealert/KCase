FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY casemind_front/dist/mycasemind-cms/ /usr/share/nginx/html/mycasemind-cms/
