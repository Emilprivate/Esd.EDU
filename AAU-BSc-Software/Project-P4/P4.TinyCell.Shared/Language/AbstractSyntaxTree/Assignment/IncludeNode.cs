namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Assignment;

public class IncludeNode(string fileName) : AstNode
{
    public string FileName { get; set; } = fileName;

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitIncludeNode(this);
    }
}