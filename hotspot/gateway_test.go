package main

import (
 "net/http"
 "net/http/httptest"
 "testing"
)

func TestGatewayBlocksUntrustedHost(t *testing.T) {
 g:=newGatewayHandler()
 for _,host:=range []string{"public.example.com","box.lemanhquyen.io.vn.evil.example","127.0.0.1:9097"}{
  req:=httptest.NewRequest("GET","http://"+host+"/ui/",nil)
  req.Host=host
  w:=httptest.NewRecorder()
  g.ServeHTTP(w,req)
  if w.Code!=403{t.Errorf("gateway unexpectedly permitted host %q with status %d",host,w.Code)}
 }
}
func TestRootApiNeverForwardsToMihomo(t *testing.T) {
 g:=newGatewayHandler()
 req:=httptest.NewRequest("GET","http://127.0.0.1:9098/api/v1/status",nil)
 w:=httptest.NewRecorder()
 g.ServeHTTP(w,req)
 if w.Code!=http.StatusServiceUnavailable{t.Fatalf("unavailable private root socket must produce 503, got %d",w.Code)}
}
