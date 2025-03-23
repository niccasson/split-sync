import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB, TextInput, Portal, Modal, List, Chip, IconButton, ActivityIndicator } from 'react-native-paper';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/LogoIcon';

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
                <View style={styles.logoContainer}>
                    <LogoIcon />
                </View>
                <Text variant="headlineMedium" style={styles.headerText}>Groups</Text>

                {groupsError ? (
                    <Text style={styles.error}>{groupsError}</Text>
                ) : null}

                {groups.map((group) => (
                    <Card key={group.id} style={styles.groupCard}>
                        <Card.Content>
                            <View style={styles.groupHeader}>
                                <Text variant="titleLarge" style={styles.groupTitle}>{group.name}</Text>
                                {group.isOwner && (
                                    <IconButton
                                        icon="delete"
                                        iconColor="#424242"
                                        onPress={() => handleDeleteGroup(group.id)}
                                    />
                                )}
                            </View>
                            <Text variant="bodySmall" style={styles.memberCount}>
                                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                            </Text>
                            <View style={styles.membersContainer}>
                                {group.members.map((member) => (
                                    <Chip
                                        key={member.id}
                                        style={styles.memberChip}
                                        textStyle={styles.memberChipText}
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
                                    textColor="#424242"
                                    buttonColor="#F5F5F5"
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
                        outlineColor="#424242"
                        activeOutlineColor="#42B095"
                    />

                    <TextInput
                        label="Add Member Email"
                        value={memberEmail}
                        onChangeText={setMemberEmail}
                        mode="outlined"
                        style={styles.input}
                        outlineColor="#424242"
                        activeOutlineColor="#42B095"
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
                        buttonColor="#42B095"
                        textColor="white"
                    >
                        Create Group
                    </Button>
                    <Button
                        onPress={() => setCreateModalVisible(false)}
                        textColor="#424242"
                    >
                        Cancel
                    </Button>
                </Modal>
            </Portal>

            {/* Add Member Modal */}
            <Portal>
                <Modal
                    visible={addMemberModalVisible}
                    onDismiss={() => setAddMemberModalVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Add Member</Text>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <TextInput
                        label="Email"
                        value={memberEmail}
                        onChangeText={setMemberEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        outlineColor="#424242"
                        activeOutlineColor="#42B095"
                    />
                    <Button
                        mode="contained"
                        onPress={handleAddMember}
                        loading={loading}
                        style={styles.modalButton}
                        buttonColor="#42B095"
                        textColor="white"
                    >
                        Add Member
                    </Button>
                    <Button
                        onPress={() => setAddMemberModalVisible(false)}
                        textColor="#424242"
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
                color="white"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#42B095', // Mint green background
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    logoContainer: {
        alignSelf: 'flex-start',
        marginTop: 40,
        marginLeft: 20,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    groupCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        borderRadius: 12,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    groupTitle: {
        color: '#424242', // Dark grey
    },
    memberCount: {
        color: '#424242', // Dark grey
    },
    membersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    memberChip: {
        margin: 4,
        backgroundColor: '#E8F5E9', // Light green background for member chips
    },
    memberChipText: {
        color: '#424242', // Dark grey text
    },
    addMemberButton: {
        marginTop: 8,
        borderColor: '#424242',
        backgroundColor: '#F5F5F5',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#42B095', // Mint green
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
        color: '#424242',
        fontSize: 20,
        fontWeight: '600',
    },
    input: {
        marginBottom: 20,
    },
    modalButton: {
        marginBottom: 12,
        borderRadius: 8,
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
        backgroundColor: '#E8F5E9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 