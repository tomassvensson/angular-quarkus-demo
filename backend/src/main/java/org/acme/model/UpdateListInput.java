package org.acme.model;

import org.eclipse.microprofile.graphql.Input;
import org.eclipse.microprofile.graphql.Name;
import io.quarkus.runtime.annotations.RegisterForReflection;
import java.util.List;

@RegisterForReflection
@Input
public class UpdateListInput {
    @Name("name")
    public String name;
    @Name("published")
    public Boolean published;
    @Name("linkIds")
    public List<String> linkIds;

    @Override
    public String toString() {
        return "UpdateListInput{name='" + name + "', published=" + published + ", linkIds=" + linkIds + "}";
    }
}
