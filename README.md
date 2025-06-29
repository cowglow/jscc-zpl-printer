```
// Example command to send ZPL to a printer from Mac (nc):
echo "^XA^FO10,100^A0,N,136,136^FD#JSCC25^FS^FO100,240^A0,N,100,100^FDPHILIP SAA^FS^XZ" | nc 192.168.1.16 9100

// Example command to send ZPL to a printer from Windows (ncat):
echo "^XA^FO10,100^A0,N,136,136^FD#JSCC25^FS^FO100,240^A0,N,100,100^FDPHILIP SAA^FS^XZ" | ncat 192.168.1.16 9100
```