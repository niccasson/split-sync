import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB, TextInput, Portal, Modal, List, Chip, IconButton, ActivityIndicator } from 'react-native-paper';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../hooks/useAuth';

export const GroupsScreen = () => {
    useAuth();
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [memberEmails, setMemberEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { groups, loading: groupsLoading, error: groupsError, createGroup, addMember, removeMember, deleteGroup } = useGroups();

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setError('Group name is required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await createGroup(groupName, memberEmails);
            setCreateModalVisible(false);
            setGroupName('');
            setMemberEmails([]);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!memberEmail.trim()) {
            setError('Email is required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await addMember(selectedGroup.id, memberEmail);
            setAddMemberModalVisible(false);
            setMemberEmail('');
            setSelectedGroup(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (groupId, userId) => {
        try {
            await removeMember(groupId, userId);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        try {
            await deleteGroup(groupId);
        } catch (error) {
            setError(error.message);
        }
    };

    if (groupsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text variant="headlineMedium" style={styles.title}>Groups</Text>

                {groupsError ? (
                    <Text style={styles.error}>{groupsError}</Text>
                ) : null}

                {groups.map((group) => (
                    <Card key={group.id} style={styles.groupCard}>
                        <Card.Content>
                            <View style={styles.groupHeader}>
                                <Text variant="titleLarge">{group.name}</Text>
                                {group.isOwner && (
                                    <IconButton
                                        icon="delete"
                                        onPress={() => handleDeleteGroup(group.id)}
                                    />
                                )}
                            </View>
                            <Text variant="bodySmall">
                                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                            </Text>
                            <View style={styles.membersContainer}>
                                {group.members.map((member) => (
                                    <Chip
                                        key={member.id}
                                        style={styles.memberChip}
                                        onClose={group.isOwner ? () => handleRemoveMember(group.id, member.id) : undefined}
                                    >
                                        {member.full_name}
                                    </Chip>
                                ))}
                            </View>
                            {group.isOwner && (
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setSelectedGroup(group);
                                        setAddMemberModalVisible(true);
                                    }}
                                    style={styles.addMemberButton}
                                >
                                    Add Member
                                </Button>
                            )}
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>

            {/* Create Group Modal */}
            <Portal>
                <Modal
                    visible={createModalVisible}
                    onDismiss={() => setCreateModalVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Create Group</Text>
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TextInput
                        label="Group Name"
                        value={groupName}
                        onChangeText={setGroupName}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Add Member Email"
                        value={memberEmail}
                        onChangeText={setMemberEmail}
                        mode="outlined"
                        style={styles.input}
                        onSubmitEditing={() => {
                            if (memberEmail) {
                                setMemberEmails([...memberEmails, memberEmail]);
                                setMemberEmail('');
                            }
                        }}
                    />

                    <View style={styles.emailChips}>
                        {memberEmails.map((email, index) => (
                            <Chip
                                key={index}
                                onClose={() => setMemberEmails(memberEmails.filter((_, i) => i !== index))}
                                style={styles.chip}
                            >
                                {email}
                            </Chip>
                        ))}
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleCreateGroup}
                        loading={loading}
                        style={styles.modalButton}
                    >
                        Create Group
                    </Button>
                    <Button
                        onPress={() => setCreateModalVisible(false)}
                    >
                        Cancel
                    </Button>
                </Modal>
            </Portal>

            {/* Add Member Modal */}
            <Portal>
                <Modal
                    visible={addMemberModalVisible}
                    onDismiss={() => {
                        setAddMemberModalVisible(false);
                        setSelectedGroup(null);
                    }}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Add Member</Text>
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TextInput
                        label="Member Email"
                        value={memberEmail}
                        onChangeText={setMemberEmail}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Button
                        mode="contained"
                        onPress={handleAddMember}
                        loading={loading}
                        style={styles.modalButton}
                    >
                        Add Member
                    </Button>
                    <Button
                        onPress={() => {
                            setAddMemberModalVisible(false);
                            setSelectedGroup(null);
                        }}
                    >
                        Cancel
                    </Button>
                </Modal>
            </Portal>

            {/* FAB for creating groups */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setCreateModalVisible(true)}
                label="Create Group"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    title: {
        marginBottom: 20,
    },
    groupCard: {
        marginBottom: 12,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    membersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    memberChip: {
        margin: 4,
    },
    addMemberButton: {
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 20,
    },
    modalButton: {
        marginBottom: 12,
    },
    error: {
        color: '#B00020',
        marginBottom: 12,
        textAlign: 'center',
    },
    emailChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    chip: {
        margin: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 