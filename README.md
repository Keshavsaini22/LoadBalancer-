This is implementation of Load Balancer

![alt text](image.png)

For testing run below:

for i in {1..9}; do curl -s http://localhost:8080/; done

seq 60 | xargs -n1 -P10 -I{} curl -s http://localhost:8080/ > /dev/null
