package main
import("testing")
func TestValidMAC(t *testing.T){
 if !validMAC.MatchString("00:11:22:aa:bb:cc"){t.Fatal("valid")}
 if validMAC.MatchString("zz:zz:zz:zz:zz:zz"){t.Fatal("invalid")}
}
func TestInterface(t *testing.T){
 if !activeIface.MatchString("ap0") || !activeIface.MatchString("swlan0"){t.Fatal("interface")}
 if activeIface.MatchString("rmnet_data0"){t.Fatal("not hotspot")}
}
