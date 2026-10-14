package main
import "testing"
func TestUpdaterNewer(t *testing.T){
 if !newer("0.0.4","0.0.3"){t.Fatal("needs update")}
 if newer("0.0.3","0.0.3"){t.Fatal("equal version")}
 if newer("0.0.3","0.0.4"){t.Fatal("downgrade")}
 if newer("1.0.4x","0.0.3"){t.Fatal("malformed")}
}
func TestSafeVersion(t *testing.T){
 if safeVersion.MatchString("../../evil"){t.Fatal("path traversal")}
}
